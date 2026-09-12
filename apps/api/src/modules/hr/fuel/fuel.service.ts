import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EmployeesService } from '../employees/employees.service';
import {
  CreateFuelDto,
  ReimburseFuelDto,
  UpdateFuelSettingsDto,
} from './dto/fuel.dto';
import {
  DEFAULT_FUEL_THRESHOLD,
  FuelRepository,
  type FuelRecordWithEmployee,
} from './fuel.repository';

export type FuelStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'FLAGGED'
  | 'REIMBURSED';

export interface FuelRecordResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  vehicleNo: string;
  fuelDate: string;
  amount: number;
  liters: number;
  purpose: string | null;
  status: FuelStatus;
  reimbursementStatus: string;
  paymentReference: string | null;
  reimbursedAt: Date | null;
  pricePerLiter: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FuelService {
  constructor(
    private readonly repository: FuelRepository,
    private readonly employeesService: EmployeesService,
  ) {}

  async list(tenantId: string) {
    const [rows, totals, threshold] = await Promise.all([
      this.repository.listByTenant(tenantId),
      this.repository.totals(tenantId),
      this.resolveThreshold(tenantId),
    ]);

    return {
      records: rows.map((row) => this.toResponse(row)),
      totals: {
        liters: this.toNumber(totals.liters),
        amount: this.toNumber(totals.amount),
      },
      threshold,
    };
  }

  async listMine(tenantId: string, userId: string) {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const rows = await this.repository.listByEmployee(tenantId, employee.id);
    return rows.map((row) => this.toResponse(row));
  }

  async getSettings(tenantId: string) {
    return { threshold: await this.resolveThreshold(tenantId) };
  }

  async updateSettings(
    tenantId: string,
    actorUserId: string,
    dto: UpdateFuelSettingsDto,
  ) {
    const saved = await this.repository.upsertSettings(
      tenantId,
      dto.threshold.toFixed(2),
      actorUserId,
    );

    return { threshold: this.toNumber(saved.threshold) };
  }

  async create(tenantId: string, actorUserId: string, dto: CreateFuelDto) {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const threshold = await this.resolveThreshold(tenantId);
    const pricePerLiter = dto.amount / dto.liters;
    const status: FuelStatus =
      pricePerLiter > threshold ? 'FLAGGED' : 'PENDING';

    const created = await this.repository.create({
      tenantId,
      employeeId: employee.id,
      vehicleNo: dto.vehicleNo,
      fuelDate: dto.fuelDate,
      amount: dto.amount.toFixed(2),
      liters: dto.liters.toFixed(2),
      purpose: dto.purpose ?? null,
      status,
      createdBy: actorUserId,
    });

    return this.toResponse({
      ...created,
      employeeFirstName: employee.firstName,
      employeeLastName: employee.lastName,
    });
  }

  async approve(tenantId: string, actorUserId: string, recordId: string) {
    const current = await this.requireRecord(tenantId, recordId);

    if (current.status !== 'PENDING' && current.status !== 'FLAGGED') {
      throw new BadRequestException(
        'Only pending or flagged fuel records can be approved',
      );
    }

    return this.setStatus(tenantId, actorUserId, current, 'APPROVED');
  }

  async reject(tenantId: string, actorUserId: string, recordId: string) {
    const current = await this.requireRecord(tenantId, recordId);

    if (current.status !== 'PENDING' && current.status !== 'FLAGGED') {
      throw new BadRequestException(
        'Only pending or flagged fuel records can be rejected',
      );
    }

    return this.setStatus(tenantId, actorUserId, current, 'REJECTED');
  }

  async reimburse(
    tenantId: string,
    actorUserId: string,
    recordId: string,
    dto: ReimburseFuelDto,
  ) {
    const current = await this.requireRecord(tenantId, recordId);

    if (current.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only approved fuel records can be reimbursed',
      );
    }

    const updated = await this.repository.update(tenantId, current.id, {
      status: 'REIMBURSED',
      reimbursementStatus: 'PAID',
      paymentReference: dto.paymentReference,
      reimbursedAt: new Date(),
      reimbursedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('Fuel record was not found');
    }

    return this.toResponse({
      ...updated,
      employeeFirstName: current.employeeFirstName,
      employeeLastName: current.employeeLastName,
    });
  }

  private async setStatus(
    tenantId: string,
    actorUserId: string,
    current: FuelRecordWithEmployee,
    status: 'APPROVED' | 'REJECTED',
  ) {
    const updated = await this.repository.update(tenantId, current.id, {
      status,
      approvedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('Fuel record was not found');
    }

    return this.toResponse({
      ...updated,
      employeeFirstName: current.employeeFirstName,
      employeeLastName: current.employeeLastName,
    });
  }

  private async requireRecord(tenantId: string, recordId: string) {
    const record = await this.repository.findById(tenantId, recordId);

    if (!record) {
      throw new NotFoundException('Fuel record was not found');
    }

    return record;
  }

  private async resolveThreshold(tenantId: string) {
    const settings = await this.repository.getSettings(tenantId);
    return settings
      ? this.toNumber(settings.threshold)
      : DEFAULT_FUEL_THRESHOLD;
  }

  private toResponse(row: FuelRecordWithEmployee): FuelRecordResponse {
    const amount = this.toNumber(row.amount);
    const liters = this.toNumber(row.liters);

    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: `${row.employeeFirstName} ${row.employeeLastName}`.trim(),
      vehicleNo: row.vehicleNo,
      fuelDate: row.fuelDate,
      amount,
      liters,
      purpose: row.purpose,
      status: row.status,
      reimbursementStatus: row.reimbursementStatus,
      paymentReference: row.paymentReference,
      reimbursedAt: row.reimbursedAt,
      pricePerLiter: liters > 0 ? amount / liters : 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
