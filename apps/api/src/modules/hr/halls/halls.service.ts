import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { HrHallBooking, HrMeetingHall, User } from '@erp/db';

import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { EmployeesService } from '../employees/employees.service';
import {
  CreateHallBookingDto,
  CreateHallDto,
  UpdateHallDto,
} from './dto/hall.dto';
import { HallsRepository, type HallBookingRecord } from './halls.repository';

export interface HallView {
  id: string;
  hallName: string;
  location: string | null;
  capacity: number | null;
  arrangementType: HrMeetingHall['arrangementType'];
  status: HrMeetingHall['status'];
  createdAt: Date;
  updatedAt: Date;
}

export interface HallBookingView {
  id: string;
  hallId: string;
  hallName: string;
  employeeId: string;
  employeeName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  status: HrHallBooking['status'];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class HallsService {
  constructor(
    private readonly repository: HallsRepository,
    private readonly employeesService: EmployeesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async listHalls(tenantId: string): Promise<HallView[]> {
    const halls = await this.repository.listHalls(tenantId);
    return halls.map((hall) => this.toHallView(hall));
  }

  async createHall(
    tenantId: string,
    actorUserId: string,
    dto: CreateHallDto,
  ): Promise<HallView> {
    const created = await this.repository.createHall({
      tenantId,
      hallName: dto.hallName,
      location: dto.location ?? null,
      capacity: dto.capacity ?? null,
      arrangementType: dto.arrangementType ?? 'BOARDROOM',
      status: dto.status ?? 'ACTIVE',
      createdBy: actorUserId,
    });

    return this.toHallView(created);
  }

  async updateHall(
    tenantId: string,
    hallId: string,
    dto: UpdateHallDto,
  ): Promise<HallView> {
    await this.requireHall(tenantId, hallId);

    const updated = await this.repository.updateHall(tenantId, hallId, {
      ...(dto.hallName !== undefined ? { hallName: dto.hallName } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.arrangementType !== undefined
        ? { arrangementType: dto.arrangementType }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });

    if (!updated) {
      throw new NotFoundException('Meeting hall was not found');
    }

    return this.toHallView(updated);
  }

  async removeHall(tenantId: string, hallId: string) {
    await this.requireHall(tenantId, hallId);
    await this.repository.deleteHall(tenantId, hallId);
    return { success: true };
  }

  async book(
    tenantId: string,
    actorUserId: string,
    dto: CreateHallBookingDto,
  ): Promise<HallBookingView> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const hall = await this.requireHall(tenantId, dto.hallId);

    if (hall.status === 'MAINTENANCE') {
      throw new BadRequestException(
        'This meeting hall is under maintenance',
      );
    }

    const startTime = requireTime(dto.startTime, 'Start time');
    const endTime = requireTime(dto.endTime, 'End time');

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after the start time');
    }

    const existing = await this.repository.listActiveForHallDate(
      tenantId,
      dto.hallId,
      dto.bookingDate,
    );

    if (
      existing.some((booking) =>
        timesOverlap(startTime, endTime, booking.startTime, booking.endTime),
      )
    ) {
      throw new ConflictException(
        'This hall is already booked for the selected time',
      );
    }

    const created = await this.repository.createBooking({
      tenantId,
      hallId: dto.hallId,
      employeeId: employee.id,
      bookingDate: dto.bookingDate,
      startTime,
      endTime,
      reason: dto.reason ?? null,
      status: 'PENDING',
      createdBy: actorUserId,
    });

    return this.requireBooking(tenantId, created.id);
  }

  async listBookings(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
  ): Promise<HallBookingView[]> {
    const canManage = await this.canManageHalls(tenantId, role);

    if (canManage) {
      const rows = await this.repository.listBookings(tenantId);
      return rows.map((row) => this.toBookingView(row));
    }

    return this.listMine(tenantId, actorUserId);
  }

  async listMine(
    tenantId: string,
    actorUserId: string,
  ): Promise<HallBookingView[]> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const rows = await this.repository.listBookings(tenantId, employee.id);
    return rows.map((row) => this.toBookingView(row));
  }

  async confirmBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<HallBookingView> {
    const current = await this.requireBookingRecord(tenantId, bookingId);

    if (current.booking.status !== 'PENDING') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    const updated = await this.repository.updateBooking(tenantId, bookingId, {
      status: 'CONFIRMED',
    });

    if (!updated) {
      throw new NotFoundException('Hall booking was not found');
    }

    return this.requireBooking(tenantId, bookingId);
  }

  async cancelBooking(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    bookingId: string,
  ): Promise<HallBookingView> {
    const current = await this.requireBookingRecord(tenantId, bookingId);
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const canManage = await this.canManageHalls(tenantId, role);
    const isOwner =
      current.booking.employeeId === employee.id ||
      current.booking.createdBy === actorUserId;

    if (!isOwner && !canManage) {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    if (current.booking.status === 'CANCELLED') {
      return this.toBookingView(current);
    }

    const updated = await this.repository.updateBooking(tenantId, bookingId, {
      status: 'CANCELLED',
    });

    if (!updated) {
      throw new NotFoundException('Hall booking was not found');
    }

    return this.requireBooking(tenantId, bookingId);
  }

  private async requireHall(tenantId: string, hallId: string) {
    const hall = await this.repository.findHall(tenantId, hallId);

    if (!hall) {
      throw new NotFoundException('Meeting hall was not found');
    }

    return hall;
  }

  private async requireBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<HallBookingView> {
    return this.toBookingView(await this.requireBookingRecord(tenantId, bookingId));
  }

  private async requireBookingRecord(tenantId: string, bookingId: string) {
    const record = await this.repository.findBooking(tenantId, bookingId);

    if (!record) {
      throw new NotFoundException('Hall booking was not found');
    }

    return record;
  }

  private canManageHalls(tenantId: string, role: User['role']) {
    return this.permissionsService.hasAll(tenantId, role, [
      PERMISSIONS.HR_HALLS_MANAGE,
    ]);
  }

  private toHallView(hall: HrMeetingHall): HallView {
    return {
      id: hall.id,
      hallName: hall.hallName,
      location: hall.location,
      capacity: hall.capacity,
      arrangementType: hall.arrangementType,
      status: hall.status,
      createdAt: hall.createdAt,
      updatedAt: hall.updatedAt,
    };
  }

  private toBookingView(record: HallBookingRecord): HallBookingView {
    return {
      id: record.booking.id,
      hallId: record.booking.hallId,
      hallName: record.hallName,
      employeeId: record.booking.employeeId,
      employeeName: `${record.employeeFirstName} ${record.employeeLastName}`.trim(),
      bookingDate: record.booking.bookingDate,
      startTime: record.booking.startTime,
      endTime: record.booking.endTime,
      reason: record.booking.reason,
      status: record.booking.status,
      createdBy: record.booking.createdBy,
      createdAt: record.booking.createdAt,
      updatedAt: record.booking.updatedAt,
    };
  }
}

export function requireTime(value: string, label: string): string {
  const normalized = normalizeBookingTime(value);

  if (!normalized) {
    throw new BadRequestException(`${label} must be HH:MM or HH:MM:SS`);
  }

  return normalized;
}

export function normalizeBookingTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}
