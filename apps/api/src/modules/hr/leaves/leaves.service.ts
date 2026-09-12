import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import type { HrEmployee, HrLeaveRequest } from '@erp/db';

import { NotificationsService } from '../../notifications/notifications.service';
import type { EmployeeResponseDto } from '../employees/dto/employee-response.dto';
import { EmployeesRepository } from '../employees/employees.repository';
import { EmployeesService } from '../employees/employees.service';
import type {
  CreateEmergencyLeaveDto,
  CreateLeaveRequestDto,
  LeaveTypeCode,
  ReviewLeaveDto,
  UpdateLeaveBalancesDto,
} from './dto/leave.dto';
import {
  LeavesRepository,
  type LeaveEmployeeSummary,
  type LeaveRequestRecord,
  type LeaveSubstituteSummary,
  type LeaveTopTakerRow,
} from './leaves.repository';

export interface LeaveRequestView {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string | null;
    department: string | null;
    photoUrl: string | null;
  };
  leaveType: LeaveTypeCode;
  substituteId: string | null;
  substitute: LeaveSubstituteSummary | null;
  referredBy: string | null;
  peerVouched: boolean;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay: boolean;
  reason: string | null;
  status: HrLeaveRequest['status'];
  approvedBy: string | null;
  adminComment: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  annualLeaveBal: number;
  sickLeaveBal: number;
  casualLeaveBal: number;
  annualLeaveEnabled: boolean;
}

export interface LeaveBalanceView {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  annualLeaveBal: number;
  sickLeaveBal: number;
  casualLeaveBal: number;
  annualLeaveEnabled: boolean;
}

export interface LeaveTopTakerView {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  totalDays: number;
}

export interface LeaveDashboard {
  pending: LeaveRequestView[];
  history: LeaveRequestView[];
  onLeaveToday: LeaveRequestView[];
  topTakers: LeaveTopTakerView[];
  balances: LeaveBalanceView[];
}

@Injectable()
export class LeavesService {
  constructor(
    private readonly repository: LeavesRepository,
    private readonly employeesService: EmployeesService,
    private readonly employeesRepository: EmployeesRepository,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async dashboard(tenantId: string): Promise<LeaveDashboard> {
    const today = todayIsoDate();
    const [pending, history, onLeaveToday, topTakers, balances] =
      await Promise.all([
        this.repository.listPending(tenantId),
        this.repository.listHistory(tenantId, 100),
        this.repository.listApprovedOnDate(tenantId, today),
        this.repository.listTopTakers(tenantId, 10),
        this.repository.listActiveBalances(tenantId),
      ]);

    return {
      pending: pending.map((row) => this.toView(row)),
      history: history.map((row) => this.toView(row)),
      onLeaveToday: onLeaveToday.map((row) => this.toView(row)),
      topTakers: topTakers.map((row) => this.toTopTaker(row)),
      balances: balances.map((row) => this.toBalance(row)),
    };
  }

  async listMine(tenantId: string, userId: string): Promise<LeaveRequestView[]> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const rows = await this.repository.listByEmployee(tenantId, employee.id);

    return rows.map((row) => this.toView(row));
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestView> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );

    this.assertRequestRules(dto, employee);
    await this.assertSubstitute(tenantId, employee.id, dto.substituteId);

    const created = await this.repository.create({
      tenantId,
      employeeId: employee.id,
      leaveType: dto.leaveType,
      substituteId: dto.substituteId ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days.toFixed(2),
      isHalfDay: dto.isHalfDay ?? false,
      reason: dto.reason ?? null,
      status: 'PENDING',
      peerVouched: false,
      createdBy: actorUserId,
    });

    await this.notifyManager(tenantId, actorUserId, employee, created);

    return this.requireView(tenantId, created.id);
  }

  async createEmergency(
    tenantId: string,
    actorUserId: string,
    dto: CreateEmergencyLeaveDto,
  ): Promise<LeaveRequestView> {
    this.assertDatesAndDays(dto.startDate, dto.endDate, dto.days);

    const employee = await this.employeesService.findById(
      tenantId,
      dto.employeeId,
    );

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Emergency leave can only be logged for an active employee',
      );
    }

    await this.deductBalance(tenantId, employee, dto.leaveType, dto.days);

    const created = await this.repository.create({
      tenantId,
      employeeId: employee.id,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days.toFixed(2),
      isHalfDay: dto.isHalfDay ?? false,
      reason: dto.reason ?? null,
      adminComment: dto.adminComment ?? null,
      status: 'APPROVED',
      peerVouched: true,
      approvedBy: actorUserId,
      createdBy: actorUserId,
    });

    return this.requireView(tenantId, created.id);
  }

  async approve(
    tenantId: string,
    actorUserId: string,
    requestId: string,
    dto: ReviewLeaveDto,
  ): Promise<LeaveRequestView> {
    const request = await this.requireRequest(tenantId, requestId);
    this.assertPending(request);

    const employee = await this.employeesService.findById(
      tenantId,
      request.employeeId,
    );
    await this.deductBalance(
      tenantId,
      employee,
      request.leaveType,
      this.toNumber(request.days) ?? 0,
    );

    const updated = await this.repository.update(tenantId, requestId, {
      status: 'APPROVED',
      approvedBy: actorUserId,
      adminComment: dto.adminComment ?? request.adminComment,
    });

    if (!updated) {
      throw new NotFoundException('Leave request was not found');
    }

    return this.requireView(tenantId, requestId);
  }

  async reject(
    tenantId: string,
    actorUserId: string,
    requestId: string,
    dto: ReviewLeaveDto,
  ): Promise<LeaveRequestView> {
    const request = await this.requireRequest(tenantId, requestId);
    this.assertPending(request);

    const updated = await this.repository.update(tenantId, requestId, {
      status: 'REJECTED',
      approvedBy: actorUserId,
      adminComment: dto.adminComment ?? request.adminComment,
    });

    if (!updated) {
      throw new NotFoundException('Leave request was not found');
    }

    return this.requireView(tenantId, requestId);
  }

  async revoke(
    tenantId: string,
    userId: string,
    requestId: string,
  ): Promise<{ success: true }> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const request = await this.requireRequest(tenantId, requestId);

    if (request.employeeId !== employee.id) {
      throw new ForbiddenException(
        'You can only revoke your own leave request',
      );
    }

    this.assertPending(request);
    await this.repository.delete(tenantId, requestId);

    return { success: true };
  }

  async updateBalances(tenantId: string, dto: UpdateLeaveBalancesDto) {
    for (const item of dto.employees) {
      const updated = await this.employeesRepository.updateLeaveBalances(
        tenantId,
        item.employeeId,
        {
          annualLeaveBal: item.annualLeaveBal.toFixed(2),
          sickLeaveBal: item.sickLeaveBal.toFixed(2),
          casualLeaveBal: item.casualLeaveBal.toFixed(2),
          annualLeaveEnabled: item.annualLeaveEnabled,
        },
      );

      if (!updated) {
        throw new NotFoundException('Employee was not found');
      }
    }

    return { success: true };
  }

  private async requireRequest(tenantId: string, requestId: string) {
    const request = await this.repository.findById(tenantId, requestId);

    if (!request) {
      throw new NotFoundException('Leave request was not found');
    }

    return request;
  }

  private async requireView(
    tenantId: string,
    requestId: string,
  ): Promise<LeaveRequestView> {
    const record = await this.repository.findRecord(tenantId, requestId);

    if (!record) {
      throw new NotFoundException('Leave request was not found');
    }

    return this.toView(record);
  }

  private assertPending(request: HrLeaveRequest) {
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        'Only a pending leave request can be updated',
      );
    }
  }

  private assertRequestRules(
    dto: CreateLeaveRequestDto,
    employee: HrEmployee,
  ) {
    this.assertDatesAndDays(dto.startDate, dto.endDate, dto.days);

    if (dto.leaveType === 'ANNUAL' && !employee.annualLeaveEnabled) {
      throw new BadRequestException(
        'Annual leave is not enabled for this employee',
      );
    }

    if (dto.leaveType === 'CASUAL' && dto.startDate <= todayIsoDate()) {
      throw new BadRequestException(
        'Casual leave requires at least one day of notice',
      );
    }
  }

  private assertDatesAndDays(
    startDate: string,
    endDate: string,
    days: number,
  ) {
    if (days <= 0) {
      throw new BadRequestException('Leave days must be greater than zero');
    }

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date cannot be earlier than the start date',
      );
    }
  }

  private async assertSubstitute(
    tenantId: string,
    employeeId: string,
    substituteId?: string | null,
  ) {
    if (!substituteId) {
      return;
    }

    if (substituteId === employeeId) {
      throw new BadRequestException(
        'A substitute must be another employee in the company',
      );
    }

    const substitute = await this.employeesService.findById(
      tenantId,
      substituteId,
    );

    if (substitute.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Substitute must be an active employee in this company',
      );
    }
  }

  private async deductBalance(
    tenantId: string,
    employee: EmployeeResponseDto,
    leaveType: LeaveTypeCode,
    days: number,
  ) {
    const field = balanceField(leaveType);
    const current = employee[field];
    const next = roundDays(current - days);

    if (next < 0) {
      throw new BadRequestException(
        'Leave balance is not enough for this request',
      );
    }

    const updated = await this.employeesRepository.updateLeaveBalances(
      tenantId,
      employee.id,
      { [field]: next.toFixed(2) },
    );

    if (!updated) {
      throw new NotFoundException('Employee was not found');
    }
  }

  private async notifyManager(
    tenantId: string,
    actorUserId: string,
    employee: HrEmployee,
    request: HrLeaveRequest,
  ) {
    if (!this.notificationsService || !employee.managerId) {
      return;
    }

    try {
      const manager = await this.employeesService.findById(
        tenantId,
        employee.managerId,
      );

      if (!manager.userId) {
        return;
      }

      await this.notificationsService.notify({
        organizationId: tenantId,
        recipientUserId: manager.userId,
        actorUserId,
        type: 'hr.leave.requested',
        title: 'Leave Request',
        message: `${employee.firstName} ${employee.lastName} requested ${leaveTypeLabel(request.leaveType).toLowerCase()} leave.`,
        actionUrl: '/hr/leaves',
        entityType: 'hr.leave',
        entityId: request.id,
      });
    } catch {
      // Manager lookup or notify should never block the request.
    }
  }

  private toView(record: LeaveRequestRecord): LeaveRequestView {
    const { request, employee, substitute } = record;

    return {
      id: request.id,
      employeeId: request.employeeId,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        designation: employee.designation,
        department: employee.department,
        photoUrl: employee.photoUrl,
      },
      leaveType: request.leaveType,
      substituteId: request.substituteId,
      substitute,
      referredBy: request.referredBy,
      peerVouched: request.peerVouched,
      startDate: request.startDate,
      endDate: request.endDate,
      days: this.toNumber(request.days) ?? 0,
      isHalfDay: request.isHalfDay,
      reason: request.reason,
      status: request.status,
      approvedBy: request.approvedBy,
      adminComment: request.adminComment,
      createdBy: request.createdBy,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      annualLeaveBal: this.toNumber(employee.annualLeaveBal) ?? 0,
      sickLeaveBal: this.toNumber(employee.sickLeaveBal) ?? 0,
      casualLeaveBal: this.toNumber(employee.casualLeaveBal) ?? 0,
      annualLeaveEnabled: employee.annualLeaveEnabled,
    };
  }

  private toBalance(row: LeaveEmployeeSummary): LeaveBalanceView {
    return {
      employeeId: row.id,
      employeeCode: row.employeeCode,
      firstName: row.firstName,
      lastName: row.lastName,
      designation: row.designation,
      department: row.department,
      photoUrl: row.photoUrl,
      annualLeaveBal: this.toNumber(row.annualLeaveBal) ?? 0,
      sickLeaveBal: this.toNumber(row.sickLeaveBal) ?? 0,
      casualLeaveBal: this.toNumber(row.casualLeaveBal) ?? 0,
      annualLeaveEnabled: row.annualLeaveEnabled,
    };
  }

  private toTopTaker(row: LeaveTopTakerRow): LeaveTopTakerView {
    return {
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      firstName: row.firstName,
      lastName: row.lastName,
      photoUrl: row.photoUrl,
      totalDays: this.toNumber(row.totalDays) ?? 0,
    };
  }

  private toNumber(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }
}

function balanceField(
  leaveType: LeaveTypeCode,
): 'annualLeaveBal' | 'sickLeaveBal' | 'casualLeaveBal' {
  if (leaveType === 'ANNUAL') {
    return 'annualLeaveBal';
  }

  if (leaveType === 'SICK') {
    return 'sickLeaveBal';
  }

  return 'casualLeaveBal';
}

function leaveTypeLabel(leaveType: LeaveTypeCode): string {
  if (leaveType === 'ANNUAL') {
    return 'Annual';
  }

  if (leaveType === 'SICK') {
    return 'Sick';
  }

  return 'Casual';
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function roundDays(value: number): number {
  return Math.round(value * 100) / 100;
}
