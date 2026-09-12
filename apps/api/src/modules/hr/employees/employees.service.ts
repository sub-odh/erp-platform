import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createPaginatedResult } from '../../../common/pagination';
import { MediaService } from '../../media/media.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import {
  EmployeeLookupsDto,
  EmployeeResponseDto,
} from './dto/employee-response.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  EmployeesRepository,
  type EmployeeRecord,
} from './employees.repository';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly repository: EmployeesRepository,
    private readonly mediaService: MediaService,
  ) {}

  async list(tenantId: string, query: ListEmployeesQueryDto) {
    const result = await this.repository.list({
      tenantId,
      search: query.search,
      status: query.status,
      department: query.department,
      designation: query.designation,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });

    return {
      ...createPaginatedResult(
        result.data.map((row) => this.toResponse(row)),
        query.page,
        query.limit,
        result.total,
      ),
      counts: result.counts,
    };
  }

  async findById(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeResponseDto> {
    const record = await this.repository.findById(tenantId, employeeId);

    if (!record) {
      throw new NotFoundException('Employee was not found');
    }

    return this.toResponse(record);
  }

  async findMe(tenantId: string, userId: string): Promise<EmployeeResponseDto> {
    const linked = await this.repository.findByUserId(tenantId, userId);

    if (!linked) {
      throw new NotFoundException('No employee profile is linked to this user');
    }

    return this.findById(tenantId, linked.id);
  }

  async requireLinkedEmployee(tenantId: string, userId: string) {
    const linked = await this.repository.findByUserId(tenantId, userId);

    if (!linked) {
      throw new NotFoundException('No employee profile is linked to this user');
    }

    return linked;
  }

  directory(tenantId: string) {
    return this.repository.directory(tenantId);
  }

  async lookups(
    tenantId: string,
    excludeEmployeeId?: string,
  ): Promise<EmployeeLookupsDto> {
    return this.repository.lookups(tenantId, excludeEmployeeId);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employeeCode = dto.employeeCode.trim().toUpperCase();
    await this.assertCodeAvailable(tenantId, employeeCode);
    await this.assertUserAvailable(tenantId, dto.userId);
    await this.assertDeviceAvailable(tenantId, dto.attendanceDeviceId);
    await this.assertManager(tenantId, dto.managerId);
    this.assertDates(dto.joinDate, dto.resignationDate);
    this.assertTargetDates(dto.targetStartDate, dto.targetEndDate);

    const created = await this.repository.create({
      tenantId,
      employeeCode,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      createdBy: actorUserId,
      updatedBy: actorUserId,
      ...this.toPersistable(dto),
    });

    return this.findById(tenantId, created.id);
  }

  async update(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);

    if (dto.employeeCode) {
      const employeeCode = dto.employeeCode.trim().toUpperCase();

      if (employeeCode !== current.employee.employeeCode) {
        await this.assertCodeAvailable(tenantId, employeeCode);
      }
    }

    if (dto.userId !== undefined) {
      await this.assertUserAvailable(tenantId, dto.userId, employeeId);
    }

    if (dto.attendanceDeviceId !== undefined) {
      await this.assertDeviceAvailable(
        tenantId,
        dto.attendanceDeviceId,
        employeeId,
      );
    }

    if (dto.managerId !== undefined) {
      await this.assertManager(tenantId, dto.managerId, employeeId);
    }

    this.assertDates(
      dto.joinDate === undefined ? current.employee.joinDate : dto.joinDate,
      dto.resignationDate === undefined
        ? current.employee.resignationDate
        : dto.resignationDate,
    );
    this.assertTargetDates(
      dto.targetStartDate === undefined
        ? current.employee.targetStartDate
        : dto.targetStartDate,
      dto.targetEndDate === undefined
        ? current.employee.targetEndDate
        : dto.targetEndDate,
    );

    const updated = await this.repository.update(tenantId, employeeId, {
      updatedBy: actorUserId,
      ...(dto.employeeCode
        ? { employeeCode: dto.employeeCode.trim().toUpperCase() }
        : {}),
      ...this.toPersistable(dto),
    });

    if (!updated) {
      throw new NotFoundException('Employee was not found');
    }

    return this.findById(tenantId, employeeId);
  }

  async deactivate(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);

    if (current.employee.status === 'INACTIVE') {
      return this.toResponse(current);
    }

    const updated = await this.repository.update(tenantId, employeeId, {
      status: 'INACTIVE',
      updatedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('Employee was not found');
    }

    return this.findById(tenantId, employeeId);
  }

  async restore(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);

    if (current.employee.status === 'ACTIVE') {
      return this.toResponse(current);
    }

    const updated = await this.repository.update(tenantId, employeeId, {
      status: 'ACTIVE',
      updatedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('Employee was not found');
    }

    return this.findById(tenantId, employeeId);
  }

  async uploadPhoto(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
    file: Express.Multer.File | undefined,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);
    const uploaded = await this.mediaService.uploadImage(file, 'employees');

    try {
      const updated = await this.repository.update(tenantId, employeeId, {
        photoUrl: uploaded.url,
        photoFileName: uploaded.fileName,
        photoMimeType: uploaded.mimeType,
        photoSize: uploaded.size,
        updatedBy: actorUserId,
      });

      if (!updated) {
        throw new NotFoundException('Employee was not found');
      }

      await this.mediaService.deleteImage(current.employee.photoUrl);
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }

    return this.findById(tenantId, employeeId);
  }

  async removePhoto(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);

    await this.repository.update(tenantId, employeeId, {
      photoUrl: null,
      photoFileName: null,
      photoMimeType: null,
      photoSize: null,
      updatedBy: actorUserId,
    });

    await this.mediaService.deleteImage(current.employee.photoUrl);

    return this.findById(tenantId, employeeId);
  }

  async uploadSignature(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
    file: Express.Multer.File | undefined,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);
    const uploaded = await this.mediaService.uploadImage(file, 'employees');

    try {
      const updated = await this.repository.update(tenantId, employeeId, {
        signatureUrl: uploaded.url,
        signatureFileName: uploaded.fileName,
        signatureMimeType: uploaded.mimeType,
        signatureSize: uploaded.size,
        updatedBy: actorUserId,
      });

      if (!updated) {
        throw new NotFoundException('Employee was not found');
      }

      await this.mediaService.deleteImage(current.employee.signatureUrl);
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }

    return this.findById(tenantId, employeeId);
  }

  async removeSignature(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<EmployeeResponseDto> {
    const current = await this.requireEmployee(tenantId, employeeId);

    await this.repository.update(tenantId, employeeId, {
      signatureUrl: null,
      signatureFileName: null,
      signatureMimeType: null,
      signatureSize: null,
      updatedBy: actorUserId,
    });

    await this.mediaService.deleteImage(current.employee.signatureUrl);

    return this.findById(tenantId, employeeId);
  }

  private async requireEmployee(tenantId: string, employeeId: string) {
    const record = await this.repository.findById(tenantId, employeeId);

    if (!record) {
      throw new NotFoundException('Employee was not found');
    }

    return record;
  }

  private async assertCodeAvailable(
    tenantId: string,
    employeeCode: string,
  ): Promise<void> {
    const existing = await this.repository.findByCode(tenantId, employeeCode);

    if (existing) {
      throw new ConflictException(
        'An employee with this employee code already exists in the company',
      );
    }
  }

  private async assertUserAvailable(
    tenantId: string,
    userId: string | null | undefined,
    currentEmployeeId?: string,
  ): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.repository.findActiveUser(tenantId, userId);

    if (!user) {
      throw new BadRequestException(
        'Linked user must belong to this company and be active',
      );
    }

    const linked = await this.repository.findByUserId(tenantId, userId);

    if (linked && linked.id !== currentEmployeeId) {
      throw new ConflictException(
        'That user account is already linked to another employee',
      );
    }
  }

  private async assertDeviceAvailable(
    tenantId: string,
    attendanceDeviceId: number | null | undefined,
    currentEmployeeId?: string,
  ): Promise<void> {
    if (!attendanceDeviceId) {
      return;
    }

    const existing = await this.repository.findByDeviceId(
      tenantId,
      attendanceDeviceId,
    );

    if (existing && existing.id !== currentEmployeeId) {
      throw new ConflictException(
        'This attendance device ID is already assigned in the company',
      );
    }
  }

  private async assertManager(
    tenantId: string,
    managerId: string | null | undefined,
    currentEmployeeId?: string,
  ): Promise<void> {
    if (!managerId) {
      return;
    }

    if (currentEmployeeId && managerId === currentEmployeeId) {
      throw new BadRequestException('An employee cannot report to themselves');
    }

    const manager = await this.repository.findById(tenantId, managerId);

    if (!manager || manager.employee.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Reporting manager must be an active employee in this company',
      );
    }

    if (currentEmployeeId) {
      const chain = await this.repository.managerChainIds(tenantId, managerId);

      if (chain.includes(currentEmployeeId)) {
        throw new BadRequestException(
          'Reporting manager would create a circular hierarchy',
        );
      }
    }
  }

  private assertDates(
    joinDate: string | null | undefined,
    resignationDate: string | null | undefined,
  ): void {
    if (joinDate && resignationDate && resignationDate < joinDate) {
      throw new BadRequestException(
        'Resignation date cannot be earlier than the joining date',
      );
    }
  }

  private assertTargetDates(
    start: string | null | undefined,
    end: string | null | undefined,
  ): void {
    if (start && end && end < start) {
      throw new BadRequestException(
        'Target end date cannot be earlier than the start date',
      );
    }
  }

  private toPersistable(
    dto: CreateEmployeeDto | UpdateEmployeeDto,
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) {
        values[key] = value;
      }
    };

    assign('userId', dto.userId);
    assign('attendanceDeviceId', dto.attendanceDeviceId);
    assign('firstName', dto.firstName?.trim());
    assign('lastName', dto.lastName?.trim());
    assign('fatherName', dto.fatherName);
    assign('motherName', dto.motherName);
    assign('dateOfBirth', dto.dateOfBirth);
    assign('gender', dto.gender);
    assign('maritalStatus', dto.maritalStatus);
    assign(
      'spouseName',
      dto.maritalStatus === 'SINGLE' ? null : dto.spouseName,
    );
    assign('workEmail', dto.workEmail);
    assign('phone', dto.phone);
    assign('altPhone', dto.altPhone);
    assign('emergencyContactName', dto.emergencyContactName);
    assign('emergencyContactPhone', dto.emergencyContactPhone);
    assign('emergencyContactRelation', dto.emergencyContactRelation);
    assign('citizenshipNumber', dto.citizenshipNumber);
    assign('panNumber', dto.panNumber);
    assign('permanentAddress', dto.permanentAddress);
    assign('currentAddress', dto.currentAddress);
    assign('bankName', dto.bankName);
    assign('bankBranch', dto.bankBranch);
    assign('bankAccountName', dto.bankAccountName);
    assign('bankAccountNumber', dto.bankAccountNumber);
    assign('joinDate', dto.joinDate);
    assign('resignationDate', dto.resignationDate);
    assign('designation', dto.designation);
    assign('department', dto.department);
    assign('qualification', dto.qualification);
    assign('pastExperience', dto.pastExperience);
    assign(
      'salary',
      dto.salary === undefined || dto.salary === null
        ? dto.salary
        : dto.salary.toFixed(2),
    );
    assign('managerId', dto.managerId);
    assign('lastIncrementMonth', dto.lastIncrementMonth);
    assign('hasSalesTarget', dto.hasSalesTarget);
    assign(
      'salesTarget',
      dto.salesTarget === undefined || dto.salesTarget === null
        ? dto.salesTarget
        : dto.salesTarget.toFixed(2),
    );
    assign(
      'yearlySalesTarget',
      dto.yearlySalesTarget === undefined || dto.yearlySalesTarget === null
        ? dto.yearlySalesTarget
        : dto.yearlySalesTarget.toFixed(2),
    );
    assign('targetStartDate', dto.targetStartDate);
    assign('targetEndDate', dto.targetEndDate);

    return values;
  }

  private toResponse(record: EmployeeRecord): EmployeeResponseDto {
    const employee = record.employee;

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      attendanceDeviceId: employee.attendanceDeviceId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fatherName: employee.fatherName,
      motherName: employee.motherName,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      spouseName: employee.spouseName,
      workEmail: employee.workEmail,
      phone: employee.phone,
      altPhone: employee.altPhone,
      emergencyContactName: employee.emergencyContactName,
      emergencyContactPhone: employee.emergencyContactPhone,
      emergencyContactRelation: employee.emergencyContactRelation,
      citizenshipNumber: employee.citizenshipNumber,
      panNumber: employee.panNumber,
      permanentAddress: employee.permanentAddress,
      currentAddress: employee.currentAddress,
      bankName: employee.bankName,
      bankBranch: employee.bankBranch,
      bankAccountName: employee.bankAccountName,
      bankAccountNumber: employee.bankAccountNumber,
      joinDate: employee.joinDate,
      resignationDate: employee.resignationDate,
      designation: employee.designation,
      department: employee.department,
      qualification: employee.qualification,
      pastExperience: employee.pastExperience,
      salary: this.toNumber(employee.salary),
      lastIncrementMonth: employee.lastIncrementMonth,
      hasSalesTarget: employee.hasSalesTarget,
      salesTarget: this.toNumber(employee.salesTarget),
      yearlySalesTarget: this.toNumber(employee.yearlySalesTarget),
      targetStartDate: employee.targetStartDate,
      targetEndDate: employee.targetEndDate,
      status: employee.status,
      photoUrl: employee.photoUrl,
      photoFileName: employee.photoFileName,
      signatureUrl: employee.signatureUrl,
      signatureFileName: employee.signatureFileName,
      userId: employee.userId,
      user: record.user,
      managerId: employee.managerId,
      manager: record.manager,
      annualLeaveBal: this.toNumber(employee.annualLeaveBal) ?? 0,
      sickLeaveBal: this.toNumber(employee.sickLeaveBal) ?? 0,
      casualLeaveBal: this.toNumber(employee.casualLeaveBal) ?? 0,
      annualLeaveEnabled: employee.annualLeaveEnabled,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
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
