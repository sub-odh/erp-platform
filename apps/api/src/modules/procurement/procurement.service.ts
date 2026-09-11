import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ProcurementGuarantee, ProcurementTender } from '@erp/db';

import type {
  CreateGuaranteeDto,
  ListGuaranteesQueryDto,
  ReleaseGuaranteeDto,
  UpdateGuaranteeDto,
} from './dto/guarantee.dto';
import type {
  CreateTenderDto,
  ListTendersQueryDto,
  UpdateTenderDto,
} from './dto/tender.dto';
import { ProcurementRepository } from './procurement.repository';
import {
  guaranteeExpiringSoon,
  tenderEnded,
  tenderUrgency,
  todayIso,
  type TenderUrgency,
} from './procurement.status';

export interface TenderResponse {
  id: string;
  title: string;
  submissionDate: string;
  closingDate: string | null;
  details: string | null;
  urgency: TenderUrgency;
  ended: boolean;
  createdAt: string;
}

export interface GuaranteeResponse {
  id: string;
  guaranteeType: 'BG' | 'PG';
  clientName: string;
  tenderDetails: string;
  bankNameBranch: string;
  amount: string;
  submissionDate: string;
  expiryDate: string;
  assignedPerson: string | null;
  documentUrl: string | null;
  status: 'ACTIVE' | 'RELEASED';
  releaseDate: string | null;
  releaseRemarks: string | null;
  expiringSoon: boolean;
  expired: boolean;
}

@Injectable()
export class ProcurementService {
  constructor(private readonly repository: ProcurementRepository) {}

  async listTenders(tenantId: string, query: ListTendersQueryDto) {
    const rows = await this.repository.listTenders({ tenantId, ...query });
    const today = todayIso();
    return rows.map((row) => this.toTender(row, today));
  }

  async createTender(tenantId: string, userId: string, dto: CreateTenderDto) {
    this.assertTenderDates(dto.submissionDate, dto.closingDate);
    const row = await this.repository.createTender(tenantId, userId, dto);
    return this.toTender(row, todayIso());
  }

  async updateTender(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateTenderDto,
  ) {
    const existing = await this.repository.findTender(tenantId, id);
    if (!existing) {
      throw new NotFoundException('Tender not found');
    }

    this.assertTenderDates(
      dto.submissionDate ?? existing.submissionDate,
      dto.closingDate === undefined ? existing.closingDate : dto.closingDate,
    );

    const row = await this.repository.updateTender(tenantId, id, userId, dto);
    if (!row) {
      throw new NotFoundException('Tender not found');
    }

    return this.toTender(row, todayIso());
  }

  async deleteTender(tenantId: string, id: string, userId: string) {
    const row = await this.repository.softDeleteTender(tenantId, id, userId);
    if (!row) {
      throw new NotFoundException('Tender not found');
    }
    return { id: row.id };
  }

  async listGuarantees(tenantId: string, query: ListGuaranteesQueryDto) {
    const rows = await this.repository.listGuarantees({ tenantId, ...query });
    const today = todayIso();
    const items = rows.map((row) => this.toGuarantee(row, today));

    return {
      items,
      summary: {
        activeCount: items.filter((item) => item.status === 'ACTIVE').length,
        activeAmount: items
          .filter((item) => item.status === 'ACTIVE')
          .reduce((total, item) => total + Number(item.amount), 0)
          .toFixed(2),
        expiringSoonCount: items.filter(
          (item) => item.status === 'ACTIVE' && item.expiringSoon,
        ).length,
        releasedCount: items.filter((item) => item.status === 'RELEASED')
          .length,
      },
    };
  }

  async createGuarantee(
    tenantId: string,
    userId: string,
    dto: CreateGuaranteeDto,
  ) {
    this.assertGuaranteeDates(dto.submissionDate, dto.expiryDate);
    const row = await this.repository.createGuarantee(tenantId, userId, dto);
    return this.toGuarantee(row, todayIso());
  }

  async updateGuarantee(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateGuaranteeDto,
  ) {
    const existing = await this.repository.findGuarantee(tenantId, id);
    if (!existing) {
      throw new NotFoundException('Guarantee not found');
    }

    this.assertGuaranteeDates(
      dto.submissionDate ?? existing.submissionDate,
      dto.expiryDate ?? existing.expiryDate,
    );

    const row = await this.repository.updateGuarantee(
      tenantId,
      id,
      userId,
      dto,
    );
    if (!row) {
      throw new NotFoundException('Guarantee not found');
    }

    return this.toGuarantee(row, todayIso());
  }

  async releaseGuarantee(
    tenantId: string,
    id: string,
    userId: string,
    dto: ReleaseGuaranteeDto,
  ) {
    const existing = await this.repository.findGuarantee(tenantId, id);
    if (!existing) {
      throw new NotFoundException('Guarantee not found');
    }

    if (existing.status === 'RELEASED') {
      throw new ConflictException('Guarantee is already released');
    }

    const row = await this.repository.releaseGuarantee(
      tenantId,
      id,
      userId,
      dto,
    );
    if (!row) {
      throw new ConflictException('Guarantee is already released');
    }

    return this.toGuarantee(row, todayIso());
  }

  async deleteGuarantee(tenantId: string, id: string, userId: string) {
    const row = await this.repository.softDeleteGuarantee(tenantId, id, userId);
    if (!row) {
      throw new NotFoundException('Guarantee not found');
    }
    return { id: row.id };
  }

  private assertTenderDates(
    submissionDate: string,
    closingDate: string | null | undefined,
  ) {
    if (closingDate && closingDate < submissionDate) {
      throw new ConflictException(
        'Closing date cannot be earlier than the submission date',
      );
    }
  }

  private assertGuaranteeDates(submissionDate: string, expiryDate: string) {
    if (expiryDate < submissionDate) {
      throw new ConflictException(
        'Expiry date cannot be earlier than the submission date',
      );
    }
  }

  private toTender(row: ProcurementTender, today: string): TenderResponse {
    return {
      id: row.id,
      title: row.title,
      submissionDate: row.submissionDate,
      closingDate: row.closingDate,
      details: row.details,
      urgency: tenderUrgency(row.submissionDate, today),
      ended: tenderEnded(row.closingDate, today),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toGuarantee(
    row: ProcurementGuarantee,
    today: string,
  ): GuaranteeResponse {
    return {
      id: row.id,
      guaranteeType: row.guaranteeType,
      clientName: row.clientName,
      tenderDetails: row.tenderDetails,
      bankNameBranch: row.bankNameBranch,
      amount: row.amount,
      submissionDate: row.submissionDate,
      expiryDate: row.expiryDate,
      assignedPerson: row.assignedPerson,
      documentUrl: row.documentUrl,
      status: row.status,
      releaseDate: row.releaseDate,
      releaseRemarks: row.releaseRemarks,
      expiringSoon:
        row.status === 'ACTIVE' && guaranteeExpiringSoon(row.expiryDate, today),
      expired: row.status === 'ACTIVE' && row.expiryDate < today,
    };
  }
}
