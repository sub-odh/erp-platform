import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PHP_ROLE_1 } from '../../auth/role-access';
import {
  STAGE_PERCENT,
  type CreatePipelineLeadDto,
  type PipelineQueryDto,
  type PipelineStage,
  type PostPipelineActivityDto,
  type UpdatePipelineProfileDto,
  type UpdatePipelineSettingsDto,
  type UpdatePipelineSourceDto,
} from './pipeline.dto';
import { PipelineRepository } from './pipeline.repository';

@Injectable()
export class PipelineService {
  constructor(private readonly repository: PipelineRepository) {}

  async list(tenantId: string, userId: string, query: PipelineQueryDto) {
    const rows = await this.repository.list(tenantId, query, userId);
    let pipeline = 0;
    let weighted = 0;
    let won = 0;
    const items = rows.map((row) => {
      const stage = this.stage(row.stage);
      const value = Number(row.dealValue);
      const percent = STAGE_PERCENT[stage];
      pipeline += value;
      if (stage !== 'Lost') weighted += value * (percent / 100);
      if (stage === 'Won') won += 1;
      return {
        ...row,
        stage,
        stagePercent: percent,
        weightedValue: (value * (percent / 100)).toFixed(2),
        dealValue: value.toFixed(2),
      };
    });
    const total = items.length;
    return {
      items,
      metrics: {
        totalPipelineValue: pipeline.toFixed(2),
        weightedPipelineValue: weighted.toFixed(2),
        totalOpportunities: total,
        winRate: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
        wonDeals: won,
        stageCount: 7,
      },
    };
  }

  async create(tenantId: string, userId: string, dto: CreatePipelineLeadDto) {
    let companyName = dto.companyName?.trim() ?? '';
    let customerId = dto.customerId ?? null;
    let contact = dto.contactPerson?.trim() ?? '';
    let phone = dto.phone?.trim() ?? '';
    let email = dto.email?.trim() ?? '';
    if (dto.newCompanyName?.trim()) {
      companyName = dto.newCompanyName.trim();
      const created = await this.repository.insertCustomer({
        tenantId,
        customerCode: `CL-${randomBytes(3).toString('hex').toUpperCase()}`,
        name: companyName,
        address: dto.clientAddress?.trim() || null,
        taxNumber: dto.clientTaxNumber?.trim() || null,
        contactPerson: contact || null,
        phone: phone || null,
        email: email || null,
        createdBy: userId,
        updatedBy: userId,
      });
      customerId = created?.id ?? null;
    } else if (customerId && !companyName) {
      const customer = await this.repository.findCustomer(tenantId, customerId);
      companyName = customer?.name ?? '';
      contact = contact || customer?.contactPerson || '';
      phone = phone || customer?.phone || '';
      email = email || customer?.email || '';
    }
    if (!companyName) {
      throw new BadRequestException('A company name is required.');
    }
    const employee = await this.repository.findEmployeeForUser(tenantId, userId);
    const stage = dto.stage ?? 'Discovery';
    const names = this.splitName(contact || companyName);
    const created = await this.repository.insertLead({
      tenantId,
      firstName: names.first,
      lastName: names.last,
      companyName,
      projectTitle: dto.projectTitle?.trim() || null,
      jobTitle: dto.projectTitle?.trim() || null,
      contactPerson: contact || null,
      phone: phone || null,
      email: email || null,
      source: dto.source?.trim() || 'Website',
      stage,
      dealValue: (dto.dealValue ?? 0).toFixed(2),
      customerId,
      assignedEmployeeId: employee?.id ?? null,
      ownerUserId: userId,
      createdBy: userId,
      updatedBy: userId,
    });
    if (!created) throw new BadRequestException('The lead could not be saved.');
    return { id: created.id };
  }

  async details(tenantId: string, userId: string, role: string, id: string) {
    const found = await this.repository.findLead(tenantId, id);
    if (!found) throw new NotFoundException('Lead record not found.');
    const [quotations, deliveryOrders, employees] = await Promise.all([
      this.repository.quotations(tenantId, id),
      this.repository.deliveryOrders(tenantId, id),
      this.repository.employees(tenantId),
    ]);
    const lead = found.lead;
    const stage = this.stage(lead.stage);
    const canUpdate =
      (PHP_ROLE_1 as readonly string[]).includes(role) ||
      found.assignedUserId === userId ||
      lead.createdBy === userId;
    return {
      id: lead.id,
      companyName: lead.companyName ?? '',
      projectTitle: lead.projectTitle ?? lead.jobTitle ?? '',
      contactPerson: lead.contactPerson || [lead.firstName, lead.lastName].filter(Boolean).join(' '),
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source ?? '',
      stage,
      stagePercent: STAGE_PERCENT[stage],
      dealValue: lead.dealValue,
      winningProbability: lead.winningProbability,
      expectedClosing: lead.expectedClosing,
      dealRemarks: lead.dealRemarks ?? '',
      createdAt: lead.createdAt,
      assignedEmployeeId: lead.assignedEmployeeId,
      assignedName: [found.assignedFirstName, found.assignedLastName].filter(Boolean).join(' ') || 'Unassigned',
      canUpdate,
      quotations,
      deliveryOrders,
      employees,
    };
  }

  async updateStage(tenantId: string, id: string, stage: PipelineStage) {
    const updated = await this.repository.updateLead(tenantId, id, { stage });
    if (!updated) throw new NotFoundException('Lead record not found.');
    return { id, stage };
  }

  async updateProfile(tenantId: string, id: string, dto: UpdatePipelineProfileDto) {
    const names = this.splitName(dto.contactPerson?.trim() || dto.companyName);
    const updated = await this.repository.updateLead(tenantId, id, {
      companyName: dto.companyName.trim(),
      projectTitle: dto.projectTitle?.trim() || null,
      jobTitle: dto.projectTitle?.trim() || null,
      contactPerson: dto.contactPerson?.trim() || null,
      firstName: names.first,
      lastName: names.last,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      assignedEmployeeId: dto.assignedEmployeeId || null,
    });
    if (!updated) throw new NotFoundException('Lead record not found.');
    return { id };
  }

  async updateSource(tenantId: string, id: string, dto: UpdatePipelineSourceDto) {
    const updated = await this.repository.updateLead(tenantId, id, {
      source: dto.source.trim(),
    });
    if (!updated) throw new NotFoundException('Lead record not found.');
    return { id };
  }

  async postActivity(tenantId: string, id: string, dto: PostPipelineActivityDto) {
    const found = await this.repository.findLead(tenantId, id);
    if (!found) throw new NotFoundException('Lead record not found.');
    const stamp = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()).replace(' ', ' ').slice(0, 16);
    const entry = `[${found.lead.stage}|${stamp}] ${dto.remarks.trim()}`;
    const prior = found.lead.dealRemarks?.trim();
    const updated = await this.repository.updateLead(tenantId, id, {
      dealRemarks: prior ? `${prior}---${entry}` : entry,
    });
    if (!updated) throw new NotFoundException('Lead record not found.');
    return { id };
  }

  async updateSettings(tenantId: string, id: string, dto: UpdatePipelineSettingsDto) {
    const updated = await this.repository.updateLead(tenantId, id, {
      stage: dto.stage,
      winningProbability: dto.winningProbability,
      dealValue: dto.dealValue.toFixed(2),
      expectedClosing: dto.expectedClosing || null,
    });
    if (!updated) throw new NotFoundException('Lead record not found.');
    return { id };
  }

  async setFinal(tenantId: string, leadId: string, quotationId: string) {
    const row = await this.repository.markFinal(tenantId, leadId, quotationId);
    if (!row) throw new NotFoundException('Quotation not found.');
    return { id: quotationId };
  }

  async purge(tenantId: string, id: string) {
    try {
      const removed = await this.repository.purge(tenantId, id);
      if (!removed) throw new NotFoundException('Lead record not found.');
      return { success: true };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23503'
      ) {
        throw new BadRequestException('This lead is still linked to another record.');
      }
      throw error;
    }
  }

  private stage(value: string | null | undefined): PipelineStage {
    if (value && value in STAGE_PERCENT) return value as PipelineStage;
    return 'Discovery';
  }

  private splitName(value: string): { first: string; last: string } {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: 'Lead', last: '' };
    return { first: parts[0] ?? 'Lead', last: parts.slice(1).join(' ') };
  }
}
