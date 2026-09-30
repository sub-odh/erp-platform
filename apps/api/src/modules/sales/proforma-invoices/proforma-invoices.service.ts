import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import type { NewSalesProformaItem } from '@erp/db';

import { CompanyService } from '../../company/company.service';
import { SmtpService } from '../../smtp/smtp.service';
import type {
  DispatchProformaInvoiceDto,
  ProformaItemDto,
  SaveProformaInvoiceDto,
} from './dto/proforma-invoice.dto';
import { amountInWords, proformaTotal } from './pi-words';
import {
  ProformaInvoicesRepository,
  type ProformaHeaderInput,
} from './proforma-invoices.repository';

const ROLE_POSITION: Record<string, string> = {
  OWNER: 'Super Admin',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Super Admin',
  HR: 'HR',
  OPERATIONS: 'Operations',
  MANAGER: 'Operations',
  EMPLOYEE: 'Employee',
  SALES: 'Sales',
  STAFF: 'Sales',
  MANAGEMENT: 'Management',
  HEAD: 'Head',
};

const DEFAULT_POSITION = 'Sales / Operations Department';

@Injectable()
export class ProformaInvoicesService {
  constructor(
    private readonly repository: ProformaInvoicesRepository,
    private readonly companyService: CompanyService,
    private readonly smtp: SmtpService,
  ) {}

  async draft(tenantId: string, userId: string) {
    const [sequence, actor] = await Promise.all([
      this.repository.nextSequence(tenantId),
      this.repository.findActor(tenantId, userId),
    ]);
    const year = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
    }).format(new Date());
    const piDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
    }).format(new Date());
    return {
      piNumber: `PI-${year}-${String(sequence).padStart(4, '0')}`,
      piDate,
      creatorName: this.creatorName(actor?.firstName, actor?.lastName),
      creatorPosition: this.creatorPosition(actor?.role),
    };
  }

  async list(
    tenantId: string,
    query: Parameters<ProformaInvoicesRepository['list']>[1],
  ) {
    const rows = await this.repository.list(tenantId, query);
    return rows.map((row) => ({
      id: row.id,
      piNumber: row.piNumber,
      piDate: row.piDate,
      customerDetails: row.customerDetails,
      totalAmount: row.totalAmount,
      currency: row.currency === 'USD' ? 'USD' : 'NPR',
      creatorName: this.creatorName(row.creatorFirstName, row.creatorLastName, 'System'),
    }));
  }

  async findDetails(tenantId: string, id: string) {
    const header = await this.repository.findHeader(tenantId, id);
    if (!header) {
      throw new NotFoundException('Proforma Invoice record not found.');
    }
    const items = await this.repository.findItems(tenantId, id);
    const currency = header.currency === 'USD' ? 'USD' : 'NPR';
    return {
      id: header.id,
      piNumber: header.piNumber,
      piDate: header.piDate,
      customerDetails: header.customerDetails,
      billTo: header.billTo,
      shipTo: header.shipTo,
      termsConditions: header.termsConditions ?? '',
      totalAmount: header.totalAmount,
      currency,
      createdAt: header.createdAt,
      creatorName: this.creatorName(
        header.creatorFirstName,
        header.creatorLastName,
        'System',
      ),
      creatorPosition: this.creatorPosition(header.creatorRole),
      signatureUrl: header.signatureUrl,
      totalInWords: amountInWords(Number(header.totalAmount), currency),
      items: items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        partNumber: item.partNumber,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }

  async create(tenantId: string, userId: string, dto: SaveProformaInvoiceDto) {
    const sequence = await this.repository.nextSequence(tenantId);
    const header: ProformaHeaderInput = {
      tenantId,
      sequence,
      piNumber: dto.piNumber.trim(),
      piDate: dto.piDate.slice(0, 10),
      customerDetails: dto.customerDetails.trim(),
      billTo: dto.billTo.trim(),
      shipTo: dto.shipTo.trim(),
      termsConditions: this.optional(dto.termsConditions),
      totalAmount: this.money(dto.items, dto.currency),
      currency: dto.currency,
      createdBy: userId,
    };
    let created: { id: string };
    try {
      created = await this.repository.create(
        header,
        this.itemRows(tenantId, dto.items),
      );
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new BadRequestException(
          'That PI number was just used. Reload the page and save again.',
        );
      }
      throw new BadRequestException('Error generating Proforma Invoice.');
    }
    return this.findDetails(tenantId, created.id);
  }

  async update(tenantId: string, id: string, dto: SaveProformaInvoiceDto) {
    await this.findDetails(tenantId, id);
    const updated = await this.repository.update(
      tenantId,
      id,
      {
        piDate: dto.piDate.slice(0, 10),
        customerDetails: dto.customerDetails.trim(),
        billTo: dto.billTo.trim(),
        shipTo: dto.shipTo.trim(),
        termsConditions: this.optional(dto.termsConditions),
        totalAmount: this.money(dto.items, dto.currency),
        currency: dto.currency,
      },
      this.itemRows(tenantId, dto.items, id),
    );
    if (!updated) {
      throw new NotFoundException('Proforma Invoice record not found.');
    }
    return this.findDetails(tenantId, id);
  }

  async purge(tenantId: string, userId: string, id: string, password: string) {
    if (!password.trim()) {
      throw new BadRequestException('Missing required parameter definitions.');
    }
    const actor = await this.repository.findActor(tenantId, userId);
    const matches =
      Boolean(actor?.passwordHash) &&
      (await compare(password, actor?.passwordHash ?? '').catch(() => false));
    if (!matches) {
      throw new BadRequestException(
        'Security clearance failed! Invalid password.',
      );
    }
    const removed = await this.repository.purge(tenantId, id);
    if (!removed) {
      throw new NotFoundException('Proforma Invoice record not found.');
    }
    return {
      success: true,
      message: 'Proforma Invoice permanently erased.',
    };
  }

  async dispatch(
    tenantId: string,
    dto: DispatchProformaInvoiceDto,
  ) {
    const company = await this.companyService.findCurrent(tenantId);
    const companyName = company.legalName?.trim() || company.name;
    const notes = dto.emailBodyNotes?.trim();
    const text = [
      notes ||
        'Please find the proforma invoice for your requested items.',
      '',
      `Proforma Invoice: ${dto.piNumber.trim()}`,
      companyName,
    ].join('\n');
    try {
      await this.smtp.send(tenantId, {
        to: dto.recipientEmail.trim(),
        subject: dto.emailSubject.trim(),
        text,
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          'SMTP is not configured. Set it up before sending email.',
        );
      }
      throw new BadRequestException(
        'The email could not be sent. Check SMTP settings.',
      );
    }
    return {
      success: true,
      message: `Proforma invoice was sent to ${dto.recipientEmail.trim()}.`,
    };
  }

  private money(
    items: ProformaItemDto[],
    currency: 'NPR' | 'USD',
  ): string {
    return proformaTotal(items, currency).total.toFixed(2);
  }

  private itemRows(
    tenantId: string,
    items: ProformaItemDto[],
    proformaInvoiceId = '00000000-0000-0000-0000-000000000000',
  ): NewSalesProformaItem[] {
    return items.map((item, index) => ({
      tenantId,
      proformaInvoiceId,
      itemName: item.itemName?.trim() ?? '',
      partNumber: item.partNumber?.trim() ?? '',
      description: item.description?.trim() ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      sortOrder: index,
    }));
  }

  private optional(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private creatorName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    fallback = 'Authorized Officer',
  ): string {
    const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return name || fallback;
  }

  private creatorPosition(role: string | null | undefined): string {
    if (!role) return DEFAULT_POSITION;
    return ROLE_POSITION[role] ?? DEFAULT_POSITION;
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const record = error as { code?: unknown; cause?: { code?: unknown } };
    if (typeof record.code === 'string') return record.code;
    return typeof record.cause?.code === 'string' ? record.cause.code : undefined;
  }
}
