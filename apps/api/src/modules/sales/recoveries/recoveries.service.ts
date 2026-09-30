import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import { SmtpService } from '../../smtp/smtp.service';
import { RecoveriesRepository } from './recoveries.repository';

const COLLECT_DENIED = new Set(['SALES', 'STAFF']);
const METHODS = {
  Cash: 'CASH',
  Cheque: 'CHEQUE',
  'Online Transfer': 'ONLINE',
} as const;
const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  ONLINE: 'Online Transfer',
  BANK: 'Bank',
  OTHER: 'Other',
};

type RecoveryStatus = 'Pending' | 'Partial' | 'Paid';

@Injectable()
export class RecoveriesService {
  constructor(
    private readonly repository: RecoveriesRepository,
    private readonly smtp: SmtpService,
  ) {}

  async list(
    tenantId: string,
    role: string,
    query: {
      search?: string;
      status?: string;
      sort?: string;
      order?: string;
      page?: string;
      limit?: string;
      notify?: boolean;
    },
  ) {
    const rows = await this.repository.list(tenantId);
    const mapped = rows.map((row) => this.present(row));
    const active = mapped.filter((row) => !row.voided);
    const counts = { Pending: 0, Partial: 0, Paid: 0 };
    let outstanding = 0;
    for (const row of active) {
      counts[row.status] += 1;
      if (row.status !== 'Paid') outstanding += row.balance;
    }
    if (query.notify !== false && !query.search && !query.status) {
      await this.dispatchDueNotices(tenantId, active);
    }
    const search = (query.search ?? '').trim().toLowerCase();
    const status = query.status ?? '';
    const filtered = mapped.filter((row) => {
      if (status && (row.voided || row.status !== status)) return false;
      if (!search) return true;
      return [row.deliveryNumber, row.customerName, row.invoiceNumber]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
    const sort = query.sort ?? 'created_at';
    const direction = query.order === 'ASC' ? 1 : -1;
    filtered.sort((left, right) => {
      const value = this.sortValue(left, sort);
      const other = this.sortValue(right, sort);
      if (value < other) return -1 * direction;
      if (value > other) return 1 * direction;
      return 0;
    });
    const limit = this.limit(query.limit);
    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));
    const page = Math.min(Math.max(1, Number(query.page) || 1), totalPages);
    const start = (page - 1) * limit;
    return {
      outstanding,
      counts,
      totalRows,
      totalPages,
      page,
      limit,
      canCollect: !COLLECT_DENIED.has(role),
      items: filtered.slice(start, start + limit).map((row) => ({
        id: row.id,
        deliveryNumber: row.deliveryNumber,
        customerName: row.customerName,
        createdAt: row.createdAt,
        invoiceNumber: row.invoiceNumber,
        balance: row.balance,
        status: row.status,
        voided: row.voided,
        agingDays: row.agingDays,
      })),
    };
  }

  async export(
    tenantId: string,
    query: { search?: string; status?: string; sort?: string; order?: string },
  ) {
    const page = await this.list(tenantId, 'OWNER', {
      ...query,
      page: '1',
      limit: '100000',
      notify: false,
    });
    const lines = [
      ['S.No.', 'Invoice Date', 'DO Number', 'Invoice Number', 'Customer Name', 'Aging (Days)', 'Balance Due (Rs.)', 'Status'],
      ...page.items.map((row, index) => [
        String(index + 1),
        this.displayDate(row.createdAt),
        row.deliveryNumber,
        row.invoiceNumber || 'N/A',
        row.customerName,
        String(row.agingDays),
        row.balance.toFixed(2),
        row.voided ? 'VOIDED' : row.status,
      ]),
    ];
    const csv = lines.map((line) => line.map(csvCell).join(',')).join('\n');
    const stamp = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()).replace(/\D/g, '');
    return { filename: `recovery_report_${stamp}.csv`, csv };
  }

  async collect(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    input: { amount: number; method: string; reference?: string; paymentDate: string },
  ) {
    this.assertCollector(role);
    const found = await this.one(tenantId, id);
    if (found.voided) throw new BadRequestException('This balance is voided.');
    if (found.status === 'Paid') throw new BadRequestException('This invoice is already paid in full');
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0.01) {
      throw new BadRequestException('Payment amount is required.');
    }
    if (amount - found.balance > 0.009) {
      throw new BadRequestException('Payment exceeds the remaining balance.');
    }
    const method = METHODS[input.method as keyof typeof METHODS];
    if (!method) throw new BadRequestException('Payment method is required.');
    const paid = Number(found.paidAmount) + amount;
    const total = Number(found.totalAmount);
    const status = paid >= total - 0.009 ? 'PAID' : 'PARTIAL';
    await this.repository.recordPayment(
      tenantId,
      found.invoiceId,
      {
        amount: amount.toFixed(2),
        method,
        referenceNumber: input.reference?.trim() || null,
        paidAt: new Date(`${input.paymentDate}T12:00:00+05:45`),
        recordedBy: userId,
      },
      paid.toFixed(2),
      status,
    );
    return { success: true };
  }

  async voidBalance(tenantId: string, userId: string, role: string, id: string, password: string) {
    this.assertCollector(role);
    if (!password) throw new BadRequestException('Invalid password. Action denied.');
    const actor = await this.repository.passwordHash(userId);
    const matches =
      Boolean(actor[0]?.passwordHash) &&
      (await compare(password, actor[0]?.passwordHash ?? '').catch(() => false));
    if (!matches) throw new BadRequestException('Invalid password. Action denied.');
    const found = await this.one(tenantId, id);
    const updated = await this.repository.voidBalance(tenantId, found.id);
    if (!updated[0]) throw new NotFoundException('Target delivery order data profile mapping not found.');
    return { success: true, message: 'Balance successfully voided.' };
  }

  async remind(tenantId: string, role: string, id: string) {
    this.assertCollector(role);
    const found = await this.one(tenantId, id);
    if (!found.customerEmail) {
      throw new BadRequestException('This customer has no email address.');
    }
    const sent = await this.sendNotice(tenantId, found, 'MANUAL');
    if (!sent) {
      throw new BadRequestException('SMTP is not configured. Set it up before sending email.');
    }
    return {
      success: true,
      message: 'Notification dispatched successfully via secure baseline channels.',
    };
  }

  async statement(tenantId: string, id: string) {
    const found = await this.one(tenantId, id);
    const [payments, company] = await Promise.all([
      this.repository.payments(tenantId, found.invoiceId),
      this.repository.company(tenantId),
    ]);
    const profile = company[0];
    const address = [profile?.addressLine1, profile?.addressLine2, profile?.city].filter(Boolean).join('\n');
    return {
      companyName: profile?.name ?? '',
      companyAddress: address,
      taxNumber: profile?.taxNumber ?? '',
      logoUrl: profile?.logoUrl ?? null,
      deliveryNumber: found.deliveryNumber,
      invoiceNumber: found.invoiceNumber,
      customerName: found.customerName,
      customerAddress: found.customerAddress ?? '',
      customerPhone: found.customerPhone ?? '',
      customerTaxNumber: found.customerTaxNumber ?? '',
      invoicedAmount: Number(found.totalAmount),
      receivedAmount: Number(found.paidAmount),
      balance: found.balance,
      paid: found.status === 'Paid' && found.balance <= 0,
      payments: payments.map((payment) => ({
        paidAt: payment.paidAt,
        method: METHOD_LABEL[payment.method] ?? payment.method,
        referenceNumber: payment.referenceNumber || '--',
        amount: payment.amount,
      })),
    };
  }

  private async dispatchDueNotices(
    tenantId: string,
    rows: ReturnType<RecoveriesService['present']>[],
  ) {
    for (const row of rows) {
      if (row.status === 'Paid' || row.voided || !row.customerEmail) continue;
      const due = row.agingDays === 35 || (row.agingDays > 35 && (row.agingDays - 35) % 30 === 0);
      if (!due || row.recoveryNoticeDay === row.agingDays) continue;
      const mode = row.agingDays === 35 ? 'AUTOMATED_INITIAL_35_DAYS' : `AUTOMATED_RECURRING_${row.agingDays}_DAYS`;
      const sent = await this.sendNotice(tenantId, row, mode);
      if (sent) await this.repository.markNoticeOne(tenantId, row.id, row.agingDays);
    }
  }

  private async sendNotice(
    tenantId: string,
    row: {
      id: string;
      deliveryNumber: string;
      balance: number;
      status: RecoveryStatus;
      createdAt: string | Date;
      customerEmail: string | null;
    },
    mode: string,
  ): Promise<boolean> {
    if (!row.customerEmail || row.status === 'Paid') return false;
    if (!(await this.smtp.hasActiveConfiguration(tenantId))) return false;
    const company = (await this.repository.company(tenantId))[0];
    const companyName = company?.name || 'Accounts Receivable';
    const statusLabel = row.status === 'Partial' ? 'Partial Paid' : 'Full Remaining';
    const subject = `Outstanding Payment Reminder – ${row.deliveryNumber}`;
    const text = [
      'Dear Customer,',
      '',
      'This email notification has been generated automatically.',
      `Delivery Order: #${row.deliveryNumber}`,
      `Invoice Date: ${this.displayDate(row.createdAt)}`,
      `Outstanding Balance Due: Rs. ${row.balance.toFixed(2)}`,
      `Due Status: ${statusLabel}`,
      '',
      `Best regards,`,
      `Accounts Receivable Team`,
      companyName,
      `(${mode})`,
    ].join('\n');
    try {
      await this.smtp.send(tenantId, { to: row.customerEmail, subject, text });
      return true;
    } catch {
      return false;
    }
  }

  private present(row: Awaited<ReturnType<RecoveriesRepository['list']>>[number]) {
    const total = Number(row.totalAmount) || 0;
    const paid = Number(row.paidAmount) || 0;
    const balance = total - paid;
    const voided = row.isVoided === 1 || row.balanceVoided === 1 || row.invoiceStatus === 'VOID';
    const status: RecoveryStatus = row.invoiceStatus === 'PAID' || balance <= 0.009 ? 'Paid' : row.invoiceStatus === 'PARTIAL' ? 'Partial' : 'Pending';
    return {
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      customerName: row.customerName,
      createdAt: row.createdAt.toISOString(),
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      totalAmount: row.totalAmount,
      paidAmount: row.paidAmount,
      balance: voided ? balance : Math.max(balance, 0),
      status,
      voided,
      agingDays: agingDays(row.createdAt),
      customerEmail: row.customerEmail,
      recoveryNoticeDay: row.recoveryNoticeDay,
    };
  }

  private async one(tenantId: string, id: string) {
    const [row] = await this.repository.findOne(tenantId, id);
    if (!row) throw new NotFoundException('Target delivery order data profile mapping not found.');
    const presented = this.present({ ...row, recoveryNoticeDay: null });
    return { ...presented, ...row };
  }

  private assertCollector(role: string) {
    if (COLLECT_DENIED.has(role)) throw new ForbiddenException('Unauthorized');
  }

  private sortValue(
    row: { createdAt: string; deliveryNumber: string; customerName: string; balance: number; status: string },
    sort: string,
  ): string | number {
    if (sort === 'do_number') return row.deliveryNumber;
    if (sort === 'client') return row.customerName.toLowerCase();
    if (sort === 'balance') return row.balance;
    if (sort === 'status') return row.status;
    return row.createdAt;
  }

  private limit(value: string | undefined): number {
    const parsed = Number(value);
    return [10, 20, 30, 50, 100].includes(parsed) ? parsed : 30;
  }

  private displayDate(value: string | Date): string {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }
}

function agingDays(createdAt: Date): number {
  const today = Date.parse(kathmanduDate(new Date()));
  const created = Date.parse(kathmanduDate(createdAt));
  return Math.max(0, Math.round((today - created) / 86_400_000));
}

function kathmanduDate(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
