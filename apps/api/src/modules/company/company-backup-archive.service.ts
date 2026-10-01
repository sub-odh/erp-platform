import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import {
  companyBackupFiles,
  companyBackupSchedules,
  db,
  organizations,
  type CompanyBackupFile,
  type CompanyBackupSchedule,
} from '@erp/db';

import { CompanyDataService, type CompanyBackup } from './company-data.service';

export interface BackupScheduleView {
  frequency: 'daily' | 'weekly';
  backupTime: string;
  backupDay: number;
  retentionMaxFiles: number;
  retentionDays: number;
  lastAutomatedRun: string | null;
}

export interface BackupFileView {
  id: string;
  filename: string;
  kind: 'manual' | 'auto';
  sizeBytes: number;
  createdAt: string;
}

const WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

@Injectable()
export class CompanyBackupArchiveService {
  constructor(private readonly companyDataService: CompanyDataService) {}

  async list(organizationId: string): Promise<{
    schedule: BackupScheduleView;
    files: BackupFileView[];
  }> {
    const schedule = await this.ensureSchedule(organizationId);
    await this.runDueBackup(organizationId, schedule);
    const current = await this.ensureSchedule(organizationId);
    const files = await this.listFiles(organizationId);

    return {
      schedule: this.toSchedule(current),
      files: files.map((file) => this.toFile(file)),
    };
  }

  async updateSchedule(
    organizationId: string,
    input: {
      frequency: 'daily' | 'weekly';
      backupTime: string;
      backupDay: number;
      retentionMaxFiles: number;
      retentionDays: number;
    },
  ): Promise<BackupScheduleView> {
    await this.ensureSchedule(organizationId);
    const backupTime = this.normalizeTime(input.backupTime);

    const [row] = await db
      .update(companyBackupSchedules)
      .set({
        frequency: input.frequency,
        backupTime,
        backupDay: input.backupDay,
        retentionMaxFiles: input.retentionMaxFiles,
        retentionDays: input.retentionDays,
        updatedAt: new Date(),
      })
      .where(eq(companyBackupSchedules.organizationId, organizationId))
      .returning();

    if (!row) {
      throw new NotFoundException('Backup schedule not found');
    }

    await this.applyRetention(organizationId, row);
    return this.toSchedule(row);
  }

  async createManual(organizationId: string): Promise<BackupFileView> {
    const schedule = await this.ensureSchedule(organizationId);
    const file = await this.storeBackup(organizationId, 'manual');
    await this.applyRetention(organizationId, schedule);
    return this.toFile(file);
  }

  async readFile(
    organizationId: string,
    fileId: string,
  ): Promise<{ filename: string; backup: CompanyBackup }> {
    const file = await this.findFile(organizationId, fileId);
    return {
      filename: file.filename,
      backup: file.payload as CompanyBackup,
    };
  }

  async deleteFile(organizationId: string, fileId: string): Promise<void> {
    const deleted = await db
      .delete(companyBackupFiles)
      .where(
        and(
          eq(companyBackupFiles.id, fileId),
          eq(companyBackupFiles.organizationId, organizationId),
        ),
      )
      .returning({ id: companyBackupFiles.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Backup file not found');
    }
  }

  async restoreFile(
    organizationId: string,
    actorUserId: string,
    fileId: string,
    confirmation: string,
    ownerPassword: string,
  ) {
    const file = await this.findFile(organizationId, fileId);
    const buffer = Buffer.from(JSON.stringify(file.payload));

    return this.companyDataService.restoreBackup(
      organizationId,
      actorUserId,
      confirmation,
      ownerPassword,
      { buffer } as Express.Multer.File,
    );
  }

  private async runDueBackup(
    organizationId: string,
    schedule: CompanyBackupSchedule,
  ): Promise<void> {
    const timeZone = await this.companyTimeZone(organizationId);
    const now = new Date();

    if (!this.isDue(schedule, now, timeZone)) {
      return;
    }

    await this.storeBackup(organizationId, 'auto', timeZone);
    await db
      .update(companyBackupSchedules)
      .set({ lastAutomatedRun: now, updatedAt: now })
      .where(eq(companyBackupSchedules.organizationId, organizationId));
    await this.applyRetention(organizationId, schedule);
  }

  private isDue(
    schedule: CompanyBackupSchedule,
    now: Date,
    timeZone: string,
  ): boolean {
    const nowParts = this.zonedParts(now, timeZone);
    const backupTime = this.normalizeTime(schedule.backupTime);

    if (schedule.frequency === 'weekly' && nowParts.weekday !== schedule.backupDay) {
      return false;
    }

    if (nowParts.time < backupTime) {
      return false;
    }

    if (!schedule.lastAutomatedRun) {
      return true;
    }

    const lastParts = this.zonedParts(schedule.lastAutomatedRun, timeZone);

    if (lastParts.date < nowParts.date) {
      return true;
    }

    return lastParts.date === nowParts.date && lastParts.time < backupTime;
  }

  private async storeBackup(
    organizationId: string,
    kind: 'manual' | 'auto',
    timeZone?: string,
  ): Promise<CompanyBackupFile> {
    const zone = timeZone ?? (await this.companyTimeZone(organizationId));
    const backup = await this.companyDataService.createBackup(organizationId);
    const payload = JSON.stringify(backup);
    const parts = this.zonedParts(new Date(), zone);
    const prefix = kind === 'manual' ? 'backup_manual_' : 'backup_auto_';
    const filename = `${prefix}${parts.date}_${parts.time.replaceAll(':', '-')}_${Date.now()}.json`;

    const [row] = await db
      .insert(companyBackupFiles)
      .values({
        organizationId,
        filename,
        kind,
        sizeBytes: Buffer.byteLength(payload),
        payload: backup,
      })
      .returning();

    if (!row) {
      throw new BadRequestException('Unable to store the company backup');
    }

    return row;
  }

  private async applyRetention(
    organizationId: string,
    schedule: Pick<
      CompanyBackupSchedule,
      'retentionMaxFiles' | 'retentionDays'
    >,
  ): Promise<void> {
    const files = await this.listFiles(organizationId);
    const cutoff = Date.now() - schedule.retentionDays * 24 * 60 * 60 * 1000;
    const expired = files.filter((file) => file.createdAt.getTime() < cutoff);
    const kept = files.filter((file) => file.createdAt.getTime() >= cutoff);
    const overflow = kept.slice(schedule.retentionMaxFiles);
    const removeIds = [...expired, ...overflow].map((file) => file.id);

    if (removeIds.length === 0) {
      return;
    }

    await db
      .delete(companyBackupFiles)
      .where(
        and(
          eq(companyBackupFiles.organizationId, organizationId),
          inArray(companyBackupFiles.id, removeIds),
        ),
      );
  }

  private async ensureSchedule(
    organizationId: string,
  ): Promise<CompanyBackupSchedule> {
    const [existing] = await db
      .select()
      .from(companyBackupSchedules)
      .where(eq(companyBackupSchedules.organizationId, organizationId))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(companyBackupSchedules)
      .values({ organizationId })
      .returning();

    if (!created) {
      throw new BadRequestException('Unable to create the backup schedule');
    }

    return created;
  }

  private async listFiles(organizationId: string): Promise<CompanyBackupFile[]> {
    return db
      .select()
      .from(companyBackupFiles)
      .where(eq(companyBackupFiles.organizationId, organizationId))
      .orderBy(desc(companyBackupFiles.createdAt));
  }

  private async findFile(
    organizationId: string,
    fileId: string,
  ): Promise<CompanyBackupFile> {
    const [file] = await db
      .select()
      .from(companyBackupFiles)
      .where(
        and(
          eq(companyBackupFiles.id, fileId),
          eq(companyBackupFiles.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!file) {
      throw new NotFoundException('Backup file not found');
    }

    return file;
  }

  private async companyTimeZone(organizationId: string): Promise<string> {
    const [company] = await db
      .select({ timezone: organizations.timezone })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    return this.safeTimeZone(company?.timezone);
  }

  private safeTimeZone(value: string | null | undefined): string {
    if (!value) {
      return 'UTC';
    }

    try {
      Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
      return value;
    } catch {
      return 'UTC';
    }
  }

  private zonedParts(date: Date, timeZone: string): {
    date: string;
    time: string;
    weekday: number;
  } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    }).formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    const hour = read('hour') === '24' ? '00' : read('hour');

    return {
      date: `${read('year')}-${read('month')}-${read('day')}`,
      time: `${hour}:${read('minute')}:${read('second')}`,
      weekday: WEEKDAYS[read('weekday')] ?? 1,
    };
  }

  private normalizeTime(value: string): string {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);

    if (!match) {
      throw new BadRequestException('Backup time must use HH:MM');
    }

    return `${match[1]}:${match[2]}:${match[3] ?? '00'}`;
  }

  private toSchedule(row: CompanyBackupSchedule): BackupScheduleView {
    return {
      frequency: row.frequency === 'weekly' ? 'weekly' : 'daily',
      backupTime: row.backupTime.slice(0, 5),
      backupDay: row.backupDay,
      retentionMaxFiles: row.retentionMaxFiles,
      retentionDays: row.retentionDays,
      lastAutomatedRun: row.lastAutomatedRun?.toISOString() ?? null,
    };
  }

  private toFile(row: CompanyBackupFile): BackupFileView {
    return {
      id: row.id,
      filename: row.filename,
      kind: row.kind === 'auto' ? 'auto' : 'manual',
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
