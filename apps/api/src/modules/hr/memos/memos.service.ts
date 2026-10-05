import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { HrMemoAttachment, User } from '@erp/db';

import { PHP_ROLE_1 } from '../../auth/role-access';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { MediaService } from '../../media/media.service';
import { EmployeesService } from '../employees/employees.service';
import { CreateMemoDto } from './dto/memo.dto';
import { MemosRepository, type MemoRecord } from './memos.repository';

export interface MemoAttachmentView {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: Date;
}

export interface MemoView {
  id: string;
  title: string;
  content: string;
  raisedBy: string;
  raisedByName: string;
  raisedByDesignation: string | null;
  verifierId: string | null;
  verifierName: string | null;
  verifierDesignation: string | null;
  currentStep: number;
  status: MemoRecord['memo']['status'];
  verifierSignedBy: string | null;
  verifierSignedByName: string | null;
  hodSignedBy: string | null;
  hodSignedByName: string | null;
  hodDesignation: string | null;
  ceoSignedBy: string | null;
  ceoSignedByName: string | null;
  ceoDesignation: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: MemoAttachmentView[];
}

@Injectable()
export class MemosService {
  constructor(
    private readonly repository: MemosRepository,
    private readonly employeesService: EmployeesService,
    private readonly permissionsService: PermissionsService,
    private readonly mediaService: MediaService,
  ) {}

  async list(tenantId: string): Promise<MemoView[]> {
    const rows = await this.repository.list(tenantId);
    const attachments = await Promise.all(
      rows.map((row) => this.repository.listAttachments(tenantId, row.memo.id)),
    );

    return rows.map((row, index) =>
      this.toView(row, attachments[index] ?? []),
    );
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateMemoDto,
  ): Promise<MemoView> {
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    await this.employeesService.findById(tenantId, dto.verifierId);

    const created = await this.repository.create({
      tenantId,
      title: dto.title,
      content: dto.content,
      raisedBy: employee.id,
      verifierId: dto.verifierId,
      currentStep: 2,
      status: 'PENDING',
      createdBy: actorUserId,
    });

    return this.requireMemo(tenantId, created.id);
  }

  async findById(tenantId: string, memoId: string): Promise<MemoView> {
    return this.requireMemo(tenantId, memoId);
  }

  async verify(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    memoId: string,
  ): Promise<MemoView> {
    const current = await this.requireRecord(tenantId, memoId);
    const employeeId = await this.actorEmployeeId(tenantId, actorUserId);

    if (current.memo.status !== 'PENDING' || current.memo.currentStep !== 2) {
      throw new BadRequestException('Only pending memos can be verified');
    }

    this.assertCanAct(current.memo, role, employeeId);

    return this.applyWorkflow(tenantId, memoId, {
      status: 'VERIFIED',
      currentStep: 3,
      ...(employeeId ? { verifierSignedBy: employeeId } : {}),
    });
  }

  async confirm(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    memoId: string,
  ): Promise<MemoView> {
    const current = await this.requireRecord(tenantId, memoId);
    const employeeId = await this.actorEmployeeId(tenantId, actorUserId);

    if (current.memo.status !== 'VERIFIED' || current.memo.currentStep !== 3) {
      throw new BadRequestException('Only verified memos can be confirmed');
    }

    this.assertCanAct(current.memo, role, employeeId);

    return this.applyWorkflow(tenantId, memoId, {
      status: 'CONFIRMED',
      currentStep: 4,
      ...(employeeId ? { hodSignedBy: employeeId } : {}),
    });
  }

  async approve(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    memoId: string,
  ): Promise<MemoView> {
    const current = await this.requireRecord(tenantId, memoId);
    const employeeId = await this.actorEmployeeId(tenantId, actorUserId);

    if (
      current.memo.status !== 'CONFIRMED' ||
      current.memo.currentStep !== 4
    ) {
      throw new BadRequestException('Only confirmed memos can be approved');
    }

    this.assertCanAct(current.memo, role, employeeId);

    return this.applyWorkflow(tenantId, memoId, {
      status: 'APPROVED',
      currentStep: 5,
      ...(employeeId ? { ceoSignedBy: employeeId } : {}),
    });
  }

  async reject(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    memoId: string,
  ): Promise<MemoView> {
    const current = await this.requireRecord(tenantId, memoId);
    const employeeId = await this.actorEmployeeId(tenantId, actorUserId);

    if (
      current.memo.status === 'APPROVED' ||
      current.memo.status === 'REJECTED'
    ) {
      throw new BadRequestException('This memo can no longer be rejected');
    }

    this.assertCanAct(current.memo, role, employeeId);

    return this.applyWorkflow(tenantId, memoId, {
      status: 'REJECTED',
      currentStep: 1,
    });
  }

  async addAttachment(
    tenantId: string,
    actorUserId: string,
    role: User['role'],
    memoId: string,
    file: Express.Multer.File | undefined,
  ): Promise<MemoView> {
    const current = await this.requireRecord(tenantId, memoId);
    const employee = await this.employeesService.requireLinkedEmployee(
      tenantId,
      actorUserId,
    );
    const canManage = await this.canManageMemos(tenantId, role);

    if (current.memo.raisedBy !== employee.id && !canManage) {
      throw new ForbiddenException(
        'You cannot attach files to this memo',
      );
    }

    const uploaded = await this.mediaService.uploadDocument(file, 'hr');

    try {
      await this.repository.createAttachment({
        tenantId,
        memoId,
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.size,
      });
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }

    return this.requireMemo(tenantId, memoId);
  }

  private async applyWorkflow(
    tenantId: string,
    memoId: string,
    values: Partial<MemoRecord['memo']>,
  ): Promise<MemoView> {
    const updated = await this.repository.update(tenantId, memoId, values);

    if (!updated) {
      throw new NotFoundException('Memo was not found');
    }

    return this.requireMemo(tenantId, memoId);
  }

  private async requireMemo(tenantId: string, memoId: string): Promise<MemoView> {
    const record = await this.requireRecord(tenantId, memoId);
    const attachments = await this.repository.listAttachments(tenantId, memoId);
    return this.toView(record, attachments);
  }

  private async requireRecord(tenantId: string, memoId: string) {
    const record = await this.repository.findById(tenantId, memoId);

    if (!record) {
      throw new NotFoundException('Memo was not found');
    }

    return record;
  }

  private async actorEmployeeId(
    tenantId: string,
    userId: string,
  ): Promise<string | null> {
    try {
      const employee = await this.employeesService.requireLinkedEmployee(
        tenantId,
        userId,
      );
      return employee.id;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private assertCanAct(
    memo: MemoRecord['memo'],
    role: User['role'],
    employeeId: string | null,
  ): void {
    const role1 = (PHP_ROLE_1 as readonly string[]).includes(role);
    const step = memo.currentStep;

    if (
      step === 2 &&
      (employeeId === memo.verifierId || role1)
    ) {
      return;
    }

    if (step === 3 && (role === 'MANAGEMENT' || role1)) {
      if (employeeId === memo.verifierId && !role1) {
        throw new ForbiddenException(
          'Conflict of Interest: You already verified this in Step 2.',
        );
      }

      return;
    }

    if (step === 4 && (role === 'HEAD' || role1)) {
      return;
    }

    if (step === 2) {
      throw new ForbiddenException(
        'Unauthorized: You are not the assigned verifier.',
      );
    }

    if (step === 3) {
      throw new ForbiddenException('Unauthorized: Management role required.');
    }

    if (step === 4) {
      throw new ForbiddenException('Unauthorized: CEO approval required.');
    }

    throw new ForbiddenException('Unauthorized');
  }

  private canManageMemos(tenantId: string, role: User['role']) {
    return this.permissionsService.hasAll(tenantId, role, [
      PERMISSIONS.HR_MEMOS_MANAGE,
    ]);
  }

  private toView(
    record: MemoRecord,
    attachments: HrMemoAttachment[],
  ): MemoView {
    const { memo } = record;

    return {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      raisedBy: memo.raisedBy,
      raisedByName: fullName(record.raisedByFirstName, record.raisedByLastName),
      raisedByDesignation: record.raisedByDesignation,
      verifierId: memo.verifierId,
      verifierName: optionalFullName(
        record.verifierFirstName,
        record.verifierLastName,
      ),
      verifierDesignation: record.verifierDesignation,
      currentStep: memo.currentStep,
      status: memo.status,
      verifierSignedBy: memo.verifierSignedBy,
      verifierSignedByName: optionalFullName(
        record.verifierSignedFirstName,
        record.verifierSignedLastName,
      ),
      hodSignedBy: memo.hodSignedBy,
      hodSignedByName: optionalFullName(
        record.hodSignedFirstName,
        record.hodSignedLastName,
      ),
      hodDesignation: record.hodDesignation,
      ceoSignedBy: memo.ceoSignedBy,
      ceoSignedByName: optionalFullName(
        record.ceoSignedFirstName,
        record.ceoSignedLastName,
      ),
      ceoDesignation: record.ceoDesignation,
      createdBy: memo.createdBy,
      createdAt: memo.createdAt,
      updatedAt: memo.updatedAt,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
      })),
    };
  }
}

function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
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
