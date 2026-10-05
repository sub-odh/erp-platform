import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createPaginatedResult } from '../../../common/pagination';
import { EmployeesService } from '../employees/employees.service';
import { HolidaysService } from '../holidays/holidays.service';
import {
  AttendanceRepository,
  type AttendanceListRow,
} from './attendance.repository';
import {
  CreateAttendanceDto,
  ListAttendanceQueryDto,
  MineAttendanceQueryDto,
  ReportAttendanceQueryDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

const LEAVE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  CASUAL: 'Casual Leave',
};

export interface AttendanceRecordDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  punchDate: string;
  inTime: string | null;
  outTime: string | null;
  duration: string | null;
  attStatus: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceFieldDutyDto {
  agenda: string;
  visitType: string;
  outTime: string;
  inTime: string | null;
}

export interface AttendanceReportRowDto {
  attendanceId: string | null;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  inTime: string | null;
  outTime: string | null;
  duration: string | null;
  fieldDuty: AttendanceFieldDutyDto[];
  holidayTitle: string | null;
  holidayLabel: string | null;
  leaveName: string | null;
  status: string;
  punctuality: string | null;
  punctualityTags: string[];
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly employeesService: EmployeesService,
    private readonly holidaysService: HolidaysService,
  ) {}

  async list(tenantId: string, query: ListAttendanceQueryDto) {
    const range = await this.resolveDateRange(
      tenantId,
      query.startDate,
      query.endDate,
    );
    const result = await this.repository.list({
      tenantId,
      search: query.search,
      startDate: range.startDate,
      endDate: range.endDate,
      page: query.page,
      limit: query.limit,
    });

    return createPaginatedResult(
      result.data.map((row) => this.toRecord(row)),
      query.page,
      query.limit,
      result.total,
    );
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateAttendanceDto,
  ): Promise<AttendanceRecordDto> {
    await this.employeesService.findById(tenantId, dto.employeeId);
    await this.assertDateAvailable(tenantId, dto.employeeId, dto.punchDate);

    const inTime = normalizeTime(dto.inTime);
    const outTime = normalizeTime(dto.outTime);

    try {
      const created = await this.repository.create({
        tenantId,
        employeeId: dto.employeeId,
        punchDate: dto.punchDate,
        inTime,
        outTime,
        duration: computeDuration(inTime, outTime),
        attStatus: computeAttStatus(inTime, outTime),
        source: 'MANUAL',
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });

      return this.requireRecord(tenantId, created.id);
    } catch (error: unknown) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    actorUserId: string,
    attendanceId: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceRecordDto> {
    const current = await this.requireRecord(tenantId, attendanceId);
    const inTime =
      dto.inTime !== undefined ? normalizeTime(dto.inTime) : current.inTime;
    const outTime =
      dto.outTime !== undefined ? normalizeTime(dto.outTime) : current.outTime;

    try {
      const updated = await this.repository.update(tenantId, attendanceId, {
        inTime,
        outTime,
        duration: computeDuration(inTime, outTime),
        attStatus: computeAttStatus(inTime, outTime),
        updatedBy: actorUserId,
      });

      if (!updated) {
        throw new NotFoundException('Attendance record was not found');
      }

      return this.requireRecord(tenantId, attendanceId);
    } catch (error: unknown) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async remove(tenantId: string, attendanceId: string) {
    await this.requireRecord(tenantId, attendanceId);
    await this.repository.delete(tenantId, attendanceId);
    return { success: true };
  }

  async checkIn(tenantId: string, userId: string): Promise<AttendanceRecordDto> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const clock = await this.nowInTenant(tenantId);
    const existing = await this.repository.findByEmployeeDate(
      tenantId,
      employee.id,
      clock.date,
    );

    if (existing && normalizeTime(existing.inTime)) {
      throw new ConflictException('Already checked in for today');
    }

    try {
      if (existing) {
        const inTime = clock.time;
        const updated = await this.repository.update(tenantId, existing.id, {
          inTime,
          duration: computeDuration(inTime, existing.outTime),
          attStatus: computeAttStatus(inTime, existing.outTime),
          source: existing.source === 'MANUAL' ? existing.source : 'SELF',
          updatedBy: userId,
        });

        if (!updated) {
          throw new NotFoundException('Attendance record was not found');
        }

        return this.requireRecord(tenantId, existing.id);
      }

      const created = await this.repository.create({
        tenantId,
        employeeId: employee.id,
        punchDate: clock.date,
        inTime: clock.time,
        outTime: null,
        duration: null,
        attStatus: 'Present',
        source: 'SELF',
        createdBy: userId,
        updatedBy: userId,
      });

      return this.requireRecord(tenantId, created.id);
    } catch (error: unknown) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async checkOut(
    tenantId: string,
    userId: string,
  ): Promise<AttendanceRecordDto> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const clock = await this.nowInTenant(tenantId);
    const existing = await this.repository.findByEmployeeDate(
      tenantId,
      employee.id,
      clock.date,
    );

    if (!existing || !normalizeTime(existing.inTime)) {
      throw new ConflictException('Check in first before checking out');
    }

    if (normalizeTime(existing.outTime)) {
      throw new ConflictException('Already checked out for today');
    }

    const outTime = clock.time;
    const updated = await this.repository.update(tenantId, existing.id, {
      outTime,
      duration: computeDuration(existing.inTime, outTime),
      attStatus: computeAttStatus(existing.inTime, outTime),
      updatedBy: userId,
    });

    if (!updated) {
      throw new NotFoundException('Attendance record was not found');
    }

    return this.requireRecord(tenantId, existing.id);
  }

  async listMine(
    tenantId: string,
    userId: string,
    query: MineAttendanceQueryDto,
  ) {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const range = await this.resolveDateRange(
      tenantId,
      query.startDate,
      query.endDate,
    );
    const rows = await this.repository.listByEmployee(
      tenantId,
      employee.id,
      range.startDate,
      range.endDate,
    );

    return rows.map((row) => this.toRecord(row));
  }

  async report(tenantId: string, query: ReportAttendanceQueryDto) {
    const range = await this.resolveDateRange(
      tenantId,
      query.startDate,
      query.endDate,
    );
    const [employees, holidays, punches, leaves, fieldVisits, office] =
      await Promise.all([
        this.employeesService.directory(tenantId),
        this.holidaysService.list(tenantId),
        this.repository.listInRange(tenantId, range.startDate, range.endDate),
        this.repository.listApprovedLeaves(
          tenantId,
          range.startDate,
          range.endDate,
        ),
        this.repository.listFieldVisits(
          tenantId,
          range.startDate,
          range.endDate,
        ),
        this.repository.getOfficeSettings(tenantId),
      ]);

    const excludeCodes = new Set(
      (query.exclude ?? '')
        .split(',')
        .map((code) => code.trim().toUpperCase())
        .filter((code) => code.length > 0),
    );
    const search = query.search?.trim().toLowerCase();
    const filtered = employees.filter((employee) => {
      if (excludeCodes.has(employee.employeeCode.toUpperCase())) {
        return false;
      }

      if (!search) {
        return true;
      }

      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return (
        name.includes(search) || employee.employeeCode.toLowerCase().includes(search)
      );
    });

    const holidayByDate = new Map<string, string>();
    for (const holiday of holidays) {
      if (
        holiday.holidayDate >= range.startDate &&
        holiday.holidayDate <= range.endDate
      ) {
        holidayByDate.set(holiday.holidayDate, holiday.title);
      }
    }

    const punchByKey = new Map<string, (typeof punches)[number]>();
    for (const punch of punches) {
      punchByKey.set(`${punch.employeeId}:${punch.punchDate}`, punch);
    }

    const visitsByKey = new Map<string, AttendanceFieldDutyDto[]>();
    for (const visit of fieldVisits) {
      const key = `${visit.employeeId}:${visit.visitDate}`;
      const current = visitsByKey.get(key) ?? [];
      current.push({
        agenda: visit.agenda,
        visitType: visit.visitType,
        outTime: visit.outTime,
        inTime: visit.inTime,
      });
      visitsByKey.set(key, current);
    }

    const dates = eachDateInRange(range.startDate, range.endDate).slice().reverse();
    const people = [...filtered].sort((left, right) =>
      left.firstName.localeCompare(right.firstName, undefined, {
        sensitivity: 'base',
      }),
    );
    const rows: AttendanceReportRowDto[] = [];

    for (const date of dates) {
      for (const employee of people) {
        const punch = punchByKey.get(`${employee.id}:${date}`);
        const holidayTitle = holidayByDate.get(date) ?? null;
        const leave = leaves.find(
          (item) =>
            item.employeeId === employee.id &&
            item.startDate <= date &&
            item.endDate >= date,
        );
        const inTime = normalizeTime(punch?.inTime);
        const outTime = normalizeTime(punch?.outTime);
        const hasPunch = Boolean(inTime || outTime);
        const tags = computePunctualityTags(
          inTime,
          outTime,
          office.officeStartTime,
          office.officeEndTime,
        );

        rows.push({
          attendanceId: punch?.id ?? null,
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          date,
          inTime,
          outTime,
          duration: hasPunch
            ? (punch?.duration ?? computeDuration(inTime, outTime))
            : null,
          fieldDuty: visitsByKey.get(`${employee.id}:${date}`) ?? [],
          holidayTitle,
          holidayLabel: holidayTitle ?? (isSaturdayDate(date) ? 'Saturday' : null),
          leaveName: leave
            ? (LEAVE_LABELS[leave.leaveType] ?? leave.leaveType)
            : null,
          status: computeReportStatus(hasPunch, holidayTitle, date),
          punctuality: tags[0] ?? null,
          punctualityTags: tags,
        });
      }
    }

    return { data: rows };
  }

  private async requireRecord(
    tenantId: string,
    attendanceId: string,
  ): Promise<AttendanceRecordDto> {
    const row = await this.repository.findById(tenantId, attendanceId);

    if (!row) {
      throw new NotFoundException('Attendance record was not found');
    }

    return this.toRecord(row);
  }

  private async assertDateAvailable(
    tenantId: string,
    employeeId: string,
    punchDate: string,
  ) {
    const existing = await this.repository.findByEmployeeDate(
      tenantId,
      employeeId,
      punchDate,
    );

    if (existing) {
      throw new ConflictException(
        'Attendance is already recorded for this employee on this date',
      );
    }
  }

  private async resolveDateRange(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (startDate && endDate) {
      return startDate <= endDate
        ? { startDate, endDate }
        : { startDate: endDate, endDate: startDate };
    }

    const office = await this.repository.getOfficeSettings(tenantId);
    const month = currentMonthInZone(office.timezone);

    return {
      startDate: startDate ?? month.startDate,
      endDate: endDate ?? month.endDate,
    };
  }

  private async nowInTenant(tenantId: string) {
    const office = await this.repository.getOfficeSettings(tenantId);
    return todayParts(office.timezone);
  }

  private toRecord(row: AttendanceListRow): AttendanceRecordDto {
    return {
      id: row.attendance.id,
      employeeId: row.attendance.employeeId,
      employeeCode: row.employeeCode,
      firstName: row.firstName,
      lastName: row.lastName,
      punchDate: row.attendance.punchDate,
      inTime: normalizeTime(row.attendance.inTime),
      outTime: normalizeTime(row.attendance.outTime),
      duration: row.attendance.duration,
      attStatus: row.attendance.attStatus,
      source: row.attendance.source,
      createdAt: row.attendance.createdAt,
      updatedAt: row.attendance.updatedAt,
    };
  }

  private rethrowDuplicate(error: unknown): void {
    if (this.databaseErrorCode(error) === '23505') {
      throw new ConflictException(
        'Attendance is already recorded for this employee on this date',
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

export function normalizeTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed === '00:00' ||
    trimmed === '00:00:00'
  ) {
    return null;
  }

  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function computeDuration(
  inTime?: string | null,
  outTime?: string | null,
): string | null {
  const start = normalizeTime(inTime);
  const end = normalizeTime(outTime);

  if (!start || !end) {
    return null;
  }

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  let diff = endMinutes - startMinutes;

  if (diff < 0) {
    diff += 24 * 60;
  }

  const hours = Math.floor(diff / 60);
  const minutes = Math.round(diff % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function computeAttStatus(
  inTime?: string | null,
  outTime?: string | null,
): string {
  return normalizeTime(inTime) || normalizeTime(outTime) ? 'Present' : 'Absent';
}

export function computeReportStatus(
  hasPunch: boolean,
  holidayTitle: string | null,
  date: string,
): string {
  const isHoliday = Boolean(holidayTitle) || isSaturdayDate(date);

  if (hasPunch && isHoliday) {
    return 'Holiday + Present';
  }

  if (hasPunch) {
    return 'Present';
  }

  if (isHoliday) {
    return 'Holiday';
  }

  return 'Absent';
}

export function computePunctualityTags(
  inTime: string | null,
  outTime: string | null,
  officeStartTime: string,
  officeEndTime: string,
): string[] {
  const tags: string[] = [];
  const start = normalizeTime(inTime);
  const end = normalizeTime(outTime);
  const officeStart = normalizeTime(officeStartTime) ?? '09:00:00';
  const officeEnd = normalizeTime(officeEndTime) ?? '17:00:00';

  if (start) {
    const lateSeconds = clockDiffSeconds(officeStart, start);

    if (lateSeconds > 0) {
      tags.push(`Late Arrival (${formatDurationDifference(lateSeconds)})`);
    } else if (lateSeconds < 0) {
      tags.push(
        `On Time (Early by ${formatDurationDifference(-lateSeconds)})`,
      );
    }
  }

  if (end) {
    const earlySeconds = clockDiffSeconds(end, officeEnd);

    if (earlySeconds > 0) {
      tags.push(`Early Logout (${formatDurationDifference(earlySeconds)})`);
    }
  }

  if (tags.length === 0 && (start || end)) {
    tags.push('On Time');
  }

  return tags;
}

function formatDurationDifference(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
}

function clockDiffSeconds(earlier: string, later: string): number {
  const start = timeToMinutes(earlier);
  const end = timeToMinutes(later);

  if (start === null || end === null) {
    return 0;
  }

  return Math.round((end - start) * 60);
}

export function isSaturdayDate(date: string): boolean {
  const utc = new Date(`${date}T00:00:00.000Z`);
  if (utc.getUTCDay() === 6) {
    return true;
  }

  const local = new Date(`${date}T00:00:00`);
  return local.getDay() === 6;
}

export function eachDateInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const last = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function timeToMinutes(time: string): number | null {
  const [hours, minutes, seconds] = time.split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    (seconds !== undefined && !Number.isFinite(seconds))
  ) {
    return null;
  }

  return hours * 60 + minutes + (seconds ? seconds / 60 : 0);
}

function todayParts(timeZone: string): { date: string; time: string } {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');

  return {
    date,
    time: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`,
  };
}

function currentMonthInZone(timeZone: string): {
  startDate: string;
  endDate: string;
} {
  const { date } = todayParts(timeZone);
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const startDate = `${yearText}-${monthText}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${yearText}-${monthText}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}
