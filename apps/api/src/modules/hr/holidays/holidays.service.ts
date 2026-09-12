import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { HolidaysRepository } from './holidays.repository';

@Injectable()
export class HolidaysService {
  constructor(private readonly repository: HolidaysRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  async create(tenantId: string, actorUserId: string, dto: CreateHolidayDto) {
    await this.assertDateAvailable(tenantId, dto.holidayDate);

    try {
      return await this.repository.create({
        tenantId,
        title: dto.title,
        description: dto.description,
        holidayDate: dto.holidayDate,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });
    } catch (error: unknown) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    actorUserId: string,
    holidayId: string,
    dto: UpdateHolidayDto,
  ) {
    const current = await this.requireHoliday(tenantId, holidayId);

    if (dto.holidayDate && dto.holidayDate !== current.holidayDate) {
      await this.assertDateAvailable(tenantId, dto.holidayDate, holidayId);
    }

    try {
      const updated = await this.repository.update(tenantId, holidayId, {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.holidayDate !== undefined
          ? { holidayDate: dto.holidayDate }
          : {}),
        updatedBy: actorUserId,
      });

      if (!updated) {
        throw new NotFoundException('Holiday was not found');
      }

      return updated;
    } catch (error: unknown) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async remove(tenantId: string, holidayId: string) {
    await this.requireHoliday(tenantId, holidayId);
    await this.repository.delete(tenantId, holidayId);
    return { success: true };
  }

  private async requireHoliday(tenantId: string, holidayId: string) {
    const holiday = await this.repository.findById(tenantId, holidayId);

    if (!holiday) {
      throw new NotFoundException('Holiday was not found');
    }

    return holiday;
  }

  private async assertDateAvailable(
    tenantId: string,
    holidayDate: string,
    excludeId?: string,
  ) {
    const existing = await this.repository.findByDate(
      tenantId,
      holidayDate,
      excludeId,
    );

    if (existing) {
      throw new ConflictException(
        'A holiday is already marked for this date in the company',
      );
    }
  }

  private rethrowDuplicate(error: unknown): void {
    if (this.databaseErrorCode(error) === '23505') {
      throw new ConflictException(
        'A holiday is already marked for this date in the company',
      );
    }
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const record = error as { code?: unknown; cause?: { code?: unknown } };
    if (typeof record.code === 'string') return record.code;
    return typeof record.cause?.code === 'string'
      ? record.cause.code
      : undefined;
  }
}
