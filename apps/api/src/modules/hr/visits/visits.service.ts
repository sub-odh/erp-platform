import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { HrFieldVisit, HrSupportVisit, User } from '@erp/db';

import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { CustomersFacade } from '../../sales/customers/customers.facade';
import { EmployeesService } from '../employees/employees.service';
import { CreateFieldVisitDto, UpdateFieldVisitDto } from './dto/field-visit.dto';
import {
  CreateSupportVisitDto,
  UpdateSupportVisitDto,
} from './dto/support-visit.dto';
import {
  VisitsRepository,
  type FieldVisitRecord,
  type SupportVisitRecord,
} from './visits.repository';

export interface SupportVisitView {
  id: string;
  visitNumber: string;
  customerId: string | null;
  clientName: string;
  deptName: string | null;
  technicianId: string | null;
  technicianName: string | null;
  teamMembers: string | null;
  visitDate: string;
  clientCallTime: string | null;
  timeStarted: string | null;
  timeEnded: string | null;
  totalHours: string | null;
  visitType: HrSupportVisit['visitType'];
  category: string | null;
  priority: string | null;
  issueDescription: string | null;
  actionTaken: string | null;
  partsUsed: string | null;
  status: HrSupportVisit['status'];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldVisitView {
  id: string;
  employeeId: string;
  employeeName: string;
  agenda: string;
  visitType: HrFieldVisit['visitType'];
  outTime: string;
  inTime: string | null;
  remarks: string | null;
  visitDate: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly repository: VisitsRepository,
    private readonly employeesService: EmployeesService,
    private readonly permissionsService: PermissionsService,
    private readonly customersFacade: CustomersFacade,
  ) {}

  async listSupport(tenantId: string): Promise<SupportVisitView[]> {
    const rows = await this.repository.listSupport(tenantId);
    return rows.map((row) => this.toSupportView(row));
  }

  async listMySupport(
    tenantId: string,
    actorUserId: string,
  ): Promise<SupportVisitView[]> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const rows = await this.repository.listMySupport(
      tenantId,
      employee.id,
      actorUserId,
    );
    return rows.map((row) => this.toSupportView(row));
  }

  async createSupport(
    tenantId: string,
    actorUserId: string,
    dto: CreateSupportVisitDto,
  ): Promise<SupportVisitView> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const technicianId = dto.technicianId ?? employee.id;
    await this.employeesService.findById(tenantId, technicianId);
    await this.assertCustomer(tenantId, dto.customerId);

    const visitNumber = await this.nextSupportNumber(tenantId, dto.visitDate);

    try {
      const created = await this.repository.createSupport({
        tenantId,
        visitNumber,
        customerId: dto.customerId ?? null,
        clientName: dto.clientName,
        deptName: dto.deptName ?? null,
        technicianId,
        teamMembers: dto.teamMembers ?? null,
        visitDate: dto.visitDate,
        clientCallTime: optionalTime(dto.clientCallTime),
        timeStarted: optionalTime(dto.timeStarted),
        timeEnded: optionalTime(dto.timeEnded),
        totalHours: dto.totalHours ?? null,
        visitType: dto.visitType ?? 'ONPREMISE',
        category: dto.category ?? null,
        priority: dto.priority ?? null,
        issueDescription: dto.issueDescription ?? null,
        actionTaken: dto.actionTaken ?? null,
        partsUsed: dto.partsUsed ?? null,
        status: dto.status ?? 'PENDING',
        createdBy: actorUserId,
      });

      return this.requireSupport(tenantId, created.id);
    } catch (error: unknown) {
      if (databaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'A support visit with this number already exists in the company',
        );
      }

      throw error;
    }
  }

  async findSupport(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    visitId: string,
  ): Promise<SupportVisitView> {
    const record = await this.requireSupportRecord(tenantId, visitId);
    await this.assertSupportAccess(tenantId, actorUserId, role, record);
    return this.toSupportView(record);
  }

  async updateSupport(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    visitId: string,
    dto: UpdateSupportVisitDto,
  ): Promise<SupportVisitView> {
    const current = await this.requireSupportRecord(tenantId, visitId);
    await this.assertSupportAccess(tenantId, actorUserId, role, current);

    if (dto.technicianId) {
      await this.employeesService.findById(tenantId, dto.technicianId);
    }

    if (dto.customerId !== undefined) {
      await this.assertCustomer(tenantId, dto.customerId);
    }

    const updated = await this.repository.updateSupport(tenantId, visitId, {
      ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
      ...(dto.customerId !== undefined ? { customerId: dto.customerId } : {}),
      ...(dto.deptName !== undefined ? { deptName: dto.deptName } : {}),
      ...(dto.visitDate !== undefined ? { visitDate: dto.visitDate } : {}),
      ...(dto.clientCallTime !== undefined
        ? { clientCallTime: optionalTime(dto.clientCallTime) }
        : {}),
      ...(dto.timeStarted !== undefined
        ? { timeStarted: optionalTime(dto.timeStarted) }
        : {}),
      ...(dto.timeEnded !== undefined
        ? { timeEnded: optionalTime(dto.timeEnded) }
        : {}),
      ...(dto.totalHours !== undefined ? { totalHours: dto.totalHours } : {}),
      ...(dto.visitType !== undefined ? { visitType: dto.visitType } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.issueDescription !== undefined
        ? { issueDescription: dto.issueDescription }
        : {}),
      ...(dto.actionTaken !== undefined ? { actionTaken: dto.actionTaken } : {}),
      ...(dto.partsUsed !== undefined ? { partsUsed: dto.partsUsed } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.teamMembers !== undefined ? { teamMembers: dto.teamMembers } : {}),
      ...(dto.technicianId !== undefined
        ? { technicianId: dto.technicianId }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException('Support visit was not found');
    }

    return this.requireSupport(tenantId, visitId);
  }

  async listField(tenantId: string): Promise<FieldVisitView[]> {
    const rows = await this.repository.listField(tenantId);
    return rows.map((row) => this.toFieldView(row));
  }

  async listMyField(
    tenantId: string,
    actorUserId: string,
  ): Promise<FieldVisitView[]> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const rows = await this.repository.listMyField(tenantId, employee.id);
    return rows.map((row) => this.toFieldView(row));
  }

  async createField(
    tenantId: string,
    actorUserId: string,
    dto: CreateFieldVisitDto,
  ): Promise<FieldVisitView> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const outTime = requireVisitTime(dto.outTime, 'Out time');
    const inTime = dto.inTime ? requireVisitTime(dto.inTime, 'In time') : null;

    const created = await this.repository.createField({
      tenantId,
      employeeId: employee.id,
      agenda: dto.agenda,
      visitType: dto.visitType,
      outTime,
      inTime,
      remarks: dto.remarks ?? null,
      visitDate: dto.visitDate,
      createdBy: actorUserId,
    });

    return this.requireField(tenantId, created.id);
  }

  async checkInField(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    visitId: string,
    dto: UpdateFieldVisitDto,
  ): Promise<FieldVisitView> {
    const current = await this.requireFieldRecord(tenantId, visitId);
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const canManage = await this.canManageVisits(tenantId, role);
    const isOwner =
      current.visit.employeeId === employee.id ||
      current.visit.createdBy === actorUserId;

    if (!isOwner && !canManage) {
      throw new ForbiddenException('You cannot check in this field visit');
    }

    const updated = await this.repository.updateField(tenantId, visitId, {
      inTime: requireVisitTime(dto.inTime, 'In time'),
    });

    if (!updated) {
      throw new NotFoundException('Field visit was not found');
    }

    return this.requireField(tenantId, visitId);
  }

  async nextSupportNumber(tenantId: string, date: string): Promise<string> {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestSupportNumber(tenantId, year);
    return nextSupportVisitNumber(year, latest);
  }

  private async requireSupport(
    tenantId: string,
    visitId: string,
  ): Promise<SupportVisitView> {
    return this.toSupportView(await this.requireSupportRecord(tenantId, visitId));
  }

  private async requireSupportRecord(tenantId: string, visitId: string) {
    const record = await this.repository.findSupport(tenantId, visitId);

    if (!record) {
      throw new NotFoundException('Support visit was not found');
    }

    return record;
  }

  private async requireField(
    tenantId: string,
    visitId: string,
  ): Promise<FieldVisitView> {
    return this.toFieldView(await this.requireFieldRecord(tenantId, visitId));
  }

  private async requireFieldRecord(tenantId: string, visitId: string) {
    const record = await this.repository.findField(tenantId, visitId);

    if (!record) {
      throw new NotFoundException('Field visit was not found');
    }

    return record;
  }

  private async assertSupportAccess(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    record: SupportVisitRecord,
  ) {
    if (await this.canManageVisits(tenantId, role)) {
      return;
    }

    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const isOwner =
      record.visit.technicianId === employee.id ||
      record.visit.createdBy === actorUserId;

    if (!isOwner) {
      throw new ForbiddenException('You cannot access this support visit');
    }
  }

  private async assertCustomer(
    tenantId: string,
    customerId?: string | null,
  ) {
    if (!customerId) {
      return;
    }

    await this.customersFacade.findById(tenantId, customerId);
  }

  private canManageVisits(tenantId: string, role: User['role']) {
    return this.permissionsService.hasAll(tenantId, role, [
      PERMISSIONS.HR_VISITS_MANAGE,
    ]);
  }

  private toSupportView(record: SupportVisitRecord): SupportVisitView {
    const { visit } = record;

    return {
      id: visit.id,
      visitNumber: visit.visitNumber,
      customerId: visit.customerId,
      clientName: visit.clientName,
      deptName: visit.deptName,
      technicianId: visit.technicianId,
      technicianName: optionalFullName(
        record.technicianFirstName,
        record.technicianLastName,
      ),
      teamMembers: visit.teamMembers,
      visitDate: visit.visitDate,
      clientCallTime: visit.clientCallTime,
      timeStarted: visit.timeStarted,
      timeEnded: visit.timeEnded,
      totalHours: visit.totalHours,
      visitType: visit.visitType,
      category: visit.category,
      priority: visit.priority,
      issueDescription: visit.issueDescription,
      actionTaken: visit.actionTaken,
      partsUsed: visit.partsUsed,
      status: visit.status,
      createdBy: visit.createdBy,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    };
  }

  private toFieldView(record: FieldVisitRecord): FieldVisitView {
    return {
      id: record.visit.id,
      employeeId: record.visit.employeeId,
      employeeName: `${record.employeeFirstName} ${record.employeeLastName}`.trim(),
      agenda: record.visit.agenda,
      visitType: record.visit.visitType,
      outTime: record.visit.outTime,
      inTime: record.visit.inTime,
      remarks: record.visit.remarks,
      visitDate: record.visit.visitDate,
      createdBy: record.visit.createdBy,
      createdAt: record.visit.createdAt,
      updatedAt: record.visit.updatedAt,
    };
  }
}

export function nextSupportVisitNumber(
  year: number,
  latest: string | null,
): string {
  const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
  return `SV-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
}

function optionalTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return requireVisitTime(value, 'Time');
}

function requireVisitTime(value: string, label: string): string {
  const trimmed = value.trim();

  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(trimmed)) {
    return trimmed;
  }

  throw new BadRequestException(`${label} must be HH:MM or HH:MM:SS`);
}

function optionalFullName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  if (!firstName && !lastName) {
    return null;
  }

  return `${firstName ?? ''} ${lastName ?? ''}`.trim();
}

function databaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const record = error as { code?: unknown; cause?: { code?: unknown } };

  if (typeof record.code === 'string') {
    return record.code;
  }

  return typeof record.cause?.code === 'string' ? record.cause.code : undefined;
}
