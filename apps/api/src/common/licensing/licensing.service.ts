import {
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { env } from '@erp/config';
import {
  evaluateLicense,
  verifySignedLicense,
  type EvaluatedLicense,
} from '@erp/licensing';

export type LicenseSummary = Pick<
  EvaluatedLicense,
  'status' | 'licensedModules' | 'validUntil' | 'maxUsers' | 'daysUntilExpiry'
>;

@Injectable()
export class LicensingService implements OnModuleInit {
  private readonly logger = new Logger(LicensingService.name);
  private license?: EvaluatedLicense;

  onModuleInit(): void {
    this.license = this.loadLicense();
    this.logger.log(
      `License ${this.license.licenseId} loaded (${this.license.status})`,
    );
  }

  getLicense(): EvaluatedLicense {
    if (!this.license) {
      throw new ServiceUnavailableException('License has not been initialized');
    }
    return this.license;
  }

  getSummary(): LicenseSummary {
    const { status, licensedModules, validUntil, maxUsers, daysUntilExpiry } =
      this.getLicense();
    return { status, licensedModules, validUntil, maxUsers, daysUntilExpiry };
  }

  assertTenant(tenantId: string): void {
    const license = this.getLicense();
    if (license.tenantId !== '*' && license.tenantId !== tenantId) {
      throw new ForbiddenException('License does not belong to this company');
    }
    if (license.status === 'blocked') {
      throw new ForbiddenException('License has expired');
    }
  }

  assertModule(module: string): void {
    if (!this.getLicense().licensedModules.includes(module)) {
      throw new ForbiddenException(`Module "${module}" is not licensed`);
    }
  }

  assertWritable(): void {
    if (this.getLicense().status === 'read_only') {
      throw new ForbiddenException(
        'License is expired; the system is read-only',
      );
    }
  }

  private loadLicense(): EvaluatedLicense {
    const licensePath = resolve(process.cwd(), env.LICENSE_PATH);
    const keyPath = resolve(process.cwd(), env.LICENSE_PUBLIC_KEY_PATH);

    if (!existsSync(licensePath) || !existsSync(keyPath)) {
      if (env.NODE_ENV === 'production') {
        throw new Error(
          `License files are required in production (${licensePath}, ${keyPath})`,
        );
      }
      this.logger.warn('Using development-only unrestricted local license');
      return evaluateLicense({
        licenseId: 'development',
        tenantId: '*',
        customer: 'Local development',
        licensedModules: ['admin', 'sales', 'inventory'],
        validUntil: '2099-12-31',
        maxUsers: 10000,
        issuedAt: '2020-01-01',
      });
    }

    const document: unknown = JSON.parse(readFileSync(licensePath, 'utf8'));
    const publicKey = readFileSync(keyPath, 'utf8');
    return evaluateLicense(verifySignedLicense(document, publicKey));
  }
}
