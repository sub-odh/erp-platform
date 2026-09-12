import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EmployeesService } from '../employees/employees.service';
import { CreateTadaDto, ReviewTadaDto } from './dto/expense.dto';
import {
  ExpensesRepository,
  type ExpenseWithEmployee,
} from './expenses.repository';

export interface TadaExpenseResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  travelDate: string;
  origin: string | null;
  destination: string | null;
  amount: number;
  purpose: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string | null;
  reimbursementStatus: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly employeesService: EmployeesService,
  ) {}

  async list(tenantId: string) {
    const rows = await this.repository.listByTenant(tenantId);
    return rows.map((row) => this.toResponse(row));
  }

  async listMine(tenantId: string, userId: string) {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      userId,
    );
    const rows = await this.repository.listByEmployee(tenantId, employee.id);
    return rows.map((row) => this.toResponse(row));
  }

  async create(tenantId: string, actorUserId: string, dto: CreateTadaDto) {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );

    const created = await this.repository.create({
      tenantId,
      employeeId: employee.id,
      expenseType: 'TADA',
      amount: dto.amount.toFixed(2),
      description: dto.purpose ?? null,
      requestDate: dto.travelDate,
      origin: dto.origin,
      destination: dto.destination,
      status: 'PENDING',
      createdBy: actorUserId,
    });

    return this.toResponse({
      ...created,
      employeeFirstName: employee.firstName,
      employeeLastName: employee.lastName,
    });
  }

  async approve(
    tenantId: string,
    actorUserId: string,
    expenseId: string,
    dto: ReviewTadaDto,
  ) {
    const current = await this.requireExpense(tenantId, expenseId);

    if (current.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending TADA requests can be approved',
      );
    }

    return this.review(tenantId, actorUserId, current, 'APPROVED', dto);
  }

  async reject(
    tenantId: string,
    actorUserId: string,
    expenseId: string,
    dto: ReviewTadaDto,
  ) {
    const current = await this.requireExpense(tenantId, expenseId);

    if (current.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending TADA requests can be rejected',
      );
    }

    return this.review(tenantId, actorUserId, current, 'REJECTED', dto);
  }

  private async review(
    tenantId: string,
    actorUserId: string,
    current: ExpenseWithEmployee,
    status: 'APPROVED' | 'REJECTED',
    dto: ReviewTadaDto,
  ) {
    const updated = await this.repository.update(tenantId, current.id, {
      status,
      remarks: dto.remarks ?? current.remarks,
      approvedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('TADA request was not found');
    }

    return this.toResponse({
      ...updated,
      employeeFirstName: current.employeeFirstName,
      employeeLastName: current.employeeLastName,
    });
  }

  private async requireExpense(tenantId: string, expenseId: string) {
    const expense = await this.repository.findById(tenantId, expenseId);

    if (!expense) {
      throw new NotFoundException('TADA request was not found');
    }

    return expense;
  }

  private toResponse(row: ExpenseWithEmployee): TadaExpenseResponse {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: `${row.employeeFirstName} ${row.employeeLastName}`.trim(),
      travelDate: row.requestDate,
      origin: row.origin,
      destination: row.destination,
      amount: this.toNumber(row.amount),
      purpose: row.description,
      status: row.status,
      remarks: row.remarks,
      reimbursementStatus: row.reimbursementStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
