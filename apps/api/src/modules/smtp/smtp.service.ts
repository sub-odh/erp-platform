import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '@erp/config';
import { db, smtpConfigurations } from '@erp/db';

import type {
  SmtpEncryption,
  UpdateSmtpConfigurationDto,
} from './dto/update-smtp-configuration.dto';

export interface SmtpConfigurationView {
  host: string;
  port: number;
  username: string;
  encryption: SmtpEncryption;
  fromEmail: string;
  senderName: string;
  isActive: boolean;
  hasPassword: boolean;
  lastTestedAt: Date | null;
  lastTestSucceeded: boolean | null;
  lastError: string | null;
}

@Injectable()
export class SmtpService {
  async getCurrent(
    organizationId: string,
  ): Promise<SmtpConfigurationView | null> {
    const config = await this.find(organizationId);
    return config ? this.toView(config) : null;
  }

  async updateCurrent(
    organizationId: string,
    dto: UpdateSmtpConfigurationDto,
  ): Promise<SmtpConfigurationView> {
    const existing = await this.find(organizationId);
    if (!existing && !dto.password) {
      throw new BadRequestException(
        'SMTP password is required for the initial configuration',
      );
    }

    const encryptedPassword = dto.password
      ? this.encrypt(dto.password)
      : existing!.encryptedPassword;
    const [saved] = await db
      .insert(smtpConfigurations)
      .values({
        organizationId,
        host: dto.host,
        port: dto.port,
        username: dto.username,
        encryptedPassword,
        encryption: dto.encryption,
        fromEmail: dto.fromEmail.toLowerCase(),
        senderName: dto.senderName,
        isActive: dto.isActive ?? true,
      })
      .onConflictDoUpdate({
        target: smtpConfigurations.organizationId,
        set: {
          host: dto.host,
          port: dto.port,
          username: dto.username,
          encryptedPassword,
          encryption: dto.encryption,
          fromEmail: dto.fromEmail.toLowerCase(),
          senderName: dto.senderName,
          isActive: dto.isActive ?? true,
          lastTestedAt: null,
          lastTestSucceeded: null,
          lastError: null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!saved)
      throw new NotFoundException('Unable to save SMTP configuration');
    return this.toView(saved);
  }

  async testCurrent(
    organizationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.requireActive(organizationId);
    try {
      await this.createTransport(config).verify();
      await this.recordTest(config.id, true, null);
      return {
        success: true,
        message: 'SMTP connection verified successfully',
      };
    } catch (error: unknown) {
      const message = this.errorMessage(error);
      await this.recordTest(config.id, false, message);
      return {
        success: false,
        message: `SMTP connection failed: ${message}`,
      };
    }
  }

  async hasActiveConfiguration(organizationId: string): Promise<boolean> {
    return Boolean(await this.find(organizationId, true));
  }

  async send(
    organizationId: string,
    input: { to: string; subject: string; text: string },
  ): Promise<void> {
    const config = await this.requireActive(organizationId);
    await this.createTransport(config).sendMail({
      from: { name: config.senderName, address: config.fromEmail },
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }

  private async find(organizationId: string, activeOnly = false) {
    const conditions = [eq(smtpConfigurations.organizationId, organizationId)];
    if (activeOnly) conditions.push(eq(smtpConfigurations.isActive, true));
    const [config] = await db
      .select()
      .from(smtpConfigurations)
      .where(and(...conditions))
      .limit(1);
    return config;
  }

  private async requireActive(organizationId: string) {
    const config = await this.find(organizationId, true);
    if (!config) {
      throw new NotFoundException('Active SMTP configuration was not found');
    }
    return config;
  }

  private createTransport(
    config: NonNullable<Awaited<ReturnType<SmtpService['find']>>>,
  ): Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'SSL',
      requireTLS: config.encryption === 'STARTTLS',
      ignoreTLS: config.encryption === 'NONE',
      auth: {
        user: config.username,
        pass: this.decrypt(config.encryptedPassword),
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }

  private async recordTest(
    id: string,
    succeeded: boolean,
    lastError: string | null,
  ): Promise<void> {
    await db
      .update(smtpConfigurations)
      .set({
        lastTestedAt: new Date(),
        lastTestSucceeded: succeeded,
        lastError,
        updatedAt: new Date(),
      })
      .where(eq(smtpConfigurations.id, id));
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  private decrypt(value: string): string {
    const [version, iv, tag, encrypted] = value.split('.');
    if (version !== 'v1' || !iv || !tag || !encrypted) {
      throw new Error('SMTP credential format is invalid');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key(),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private key(): Buffer {
    return createHash('sha256')
      .update(env.SMTP_CREDENTIAL_ENCRYPTION_KEY)
      .digest();
  }

  private toView(
    config: NonNullable<Awaited<ReturnType<SmtpService['find']>>>,
  ): SmtpConfigurationView {
    return {
      host: config.host,
      port: config.port,
      username: config.username,
      encryption: config.encryption as SmtpEncryption,
      fromEmail: config.fromEmail,
      senderName: config.senderName,
      isActive: config.isActive,
      hasPassword: Boolean(config.encryptedPassword),
      lastTestedAt: config.lastTestedAt,
      lastTestSucceeded: config.lastTestSucceeded,
      lastError: config.lastError,
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message.slice(0, 1000)
      : 'Unknown SMTP error';
  }
}
