import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import type { SalesCustomer, User } from '@erp/db';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../../common/pagination';
import { MediaService } from '../../media/media.service';
import { UsersService } from '../../users/users.service';
import { CLIENT_SAMPLE_CSV, parseCustomerCsv } from './customers-csv';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import type { CustomerHistoryResponseDto } from './dto/customer-history-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const DELETE_ROLES: User['role'][] = ['OWNER', 'SUPER_ADMIN'];

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async list(
    tenantId: string,
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    const [result, stats] = await Promise.all([
      this.customersRepository.list({
        tenantId,
        search: query.search,
        isActive: query.isActive,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      }),
      this.customersRepository.loadDirectoryStats(tenantId),
    ]);

    return createPaginatedResult(
      result.data.map((customer) =>
        CustomerResponseDto.fromEntity(
          customer,
          this.customersRepository.statsFor(customer, stats),
        ),
      ),
      query.page,
      query.limit,
      result.total,
    );
  }

  async findById(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerResponseDto> {
    const customer = await this.requireCustomer(tenantId, customerId);
    const stats = await this.customersRepository.loadDirectoryStats(tenantId);
    return CustomerResponseDto.fromEntity(
      customer,
      this.customersRepository.statsFor(customer, stats),
    );
  }

  async history(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerHistoryResponseDto> {
    const customer = await this.findById(tenantId, customerId);
    const orders = await this.customersRepository.listHistory(
      tenantId,
      customer.name,
    );
    const totalDue = orders
      .reduce((sum, order) => sum + Number(order.balanceDue), 0)
      .toFixed(2);

    return {
      customer,
      orders,
      totalOrders: orders.length,
      totalDue,
    };
  }

  async create(
    tenantId: string,
    actorUserId: string,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const name = createCustomerDto.name.trim();
    await this.ensureNameAvailable(tenantId, name);

    const taxNumber = this.normalizeOptionalText(createCustomerDto.taxNumber);
    if (taxNumber) {
      await this.ensureTaxNumberAvailable(tenantId, taxNumber);
    }

    const customerCode = createCustomerDto.customerCode
      ? this.normalizeCustomerCode(createCustomerDto.customerCode)
      : await this.customersRepository.nextCustomerCode(tenantId);

    await this.ensureCustomerCodeAvailable(tenantId, customerCode);

    try {
      const createdCustomer = await this.customersRepository.create({
        tenantId,
        actorUserId,
        customerCode,
        name,
        legalName: this.normalizeOptionalText(createCustomerDto.legalName),
        taxNumber,
        contactPerson: this.normalizeOptionalText(
          createCustomerDto.contactPerson,
        ),
        address: this.normalizeOptionalText(createCustomerDto.address),
        email: this.normalizeOptionalEmail(createCustomerDto.email),
        phone: this.normalizeOptionalText(createCustomerDto.phone),
        website: this.normalizeOptionalText(createCustomerDto.website),

        billingAddressLine1: this.normalizeOptionalText(
          createCustomerDto.billingAddressLine1,
        ),
        billingAddressLine2: this.normalizeOptionalText(
          createCustomerDto.billingAddressLine2,
        ),
        billingCity: this.normalizeOptionalText(createCustomerDto.billingCity),
        billingState: this.normalizeOptionalText(
          createCustomerDto.billingState,
        ),
        billingPostalCode: this.normalizeOptionalText(
          createCustomerDto.billingPostalCode,
        ),
        billingCountry: this.normalizeOptionalText(
          createCustomerDto.billingCountry,
        ),

        shippingAddressLine1: this.normalizeOptionalText(
          createCustomerDto.shippingAddressLine1,
        ),
        shippingAddressLine2: this.normalizeOptionalText(
          createCustomerDto.shippingAddressLine2,
        ),
        shippingCity: this.normalizeOptionalText(
          createCustomerDto.shippingCity,
        ),
        shippingState: this.normalizeOptionalText(
          createCustomerDto.shippingState,
        ),
        shippingPostalCode: this.normalizeOptionalText(
          createCustomerDto.shippingPostalCode,
        ),
        shippingCountry: this.normalizeOptionalText(
          createCustomerDto.shippingCountry,
        ),

        creditLimit: createCustomerDto.creditLimit,
        paymentTermsDays: createCustomerDto.paymentTermsDays,
        notes: this.normalizeOptionalText(createCustomerDto.notes),
        isActive: createCustomerDto.isActive,
      });

      return this.findById(tenantId, createdCustomer.id);
    } catch (error: unknown) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const existingCustomer = await this.requireCustomer(tenantId, customerId);

    const customerCode =
      updateCustomerDto.customerCode !== undefined
        ? this.normalizeCustomerCode(updateCustomerDto.customerCode)
        : undefined;

    if (
      customerCode !== undefined &&
      customerCode !== existingCustomer.customerCode
    ) {
      await this.ensureCustomerCodeAvailable(tenantId, customerCode);
    }

    if (updateCustomerDto.name !== undefined) {
      await this.ensureNameAvailable(
        tenantId,
        updateCustomerDto.name.trim(),
        customerId,
      );
    }

    const taxNumber = this.normalizeOptionalNullableText(
      updateCustomerDto.taxNumber,
    );
    if (typeof taxNumber === 'string') {
      await this.ensureTaxNumberAvailable(tenantId, taxNumber, customerId);
    }

    try {
      const updatedCustomer = await this.customersRepository.update(
        tenantId,
        customerId,
        actorUserId,
        {
          customerCode,
          name:
            updateCustomerDto.name !== undefined
              ? updateCustomerDto.name.trim()
              : undefined,
          legalName: this.normalizeOptionalNullableText(
            updateCustomerDto.legalName,
          ),
          taxNumber,
          contactPerson: this.normalizeOptionalNullableText(
            updateCustomerDto.contactPerson,
          ),
          address: this.normalizeOptionalNullableText(
            updateCustomerDto.address,
          ),
          email: this.normalizeOptionalNullableEmail(updateCustomerDto.email),
          phone: this.normalizeOptionalNullableText(updateCustomerDto.phone),
          website: this.normalizeOptionalNullableText(
            updateCustomerDto.website,
          ),

          billingAddressLine1: this.normalizeOptionalNullableText(
            updateCustomerDto.billingAddressLine1,
          ),
          billingAddressLine2: this.normalizeOptionalNullableText(
            updateCustomerDto.billingAddressLine2,
          ),
          billingCity: this.normalizeOptionalNullableText(
            updateCustomerDto.billingCity,
          ),
          billingState: this.normalizeOptionalNullableText(
            updateCustomerDto.billingState,
          ),
          billingPostalCode: this.normalizeOptionalNullableText(
            updateCustomerDto.billingPostalCode,
          ),
          billingCountry: this.normalizeOptionalNullableText(
            updateCustomerDto.billingCountry,
          ),

          shippingAddressLine1: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingAddressLine1,
          ),
          shippingAddressLine2: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingAddressLine2,
          ),
          shippingCity: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingCity,
          ),
          shippingState: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingState,
          ),
          shippingPostalCode: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingPostalCode,
          ),
          shippingCountry: this.normalizeOptionalNullableText(
            updateCustomerDto.shippingCountry,
          ),

          creditLimit: updateCustomerDto.creditLimit,
          paymentTermsDays: updateCustomerDto.paymentTermsDays,
          notes: this.normalizeOptionalNullableText(updateCustomerDto.notes),
          isActive: updateCustomerDto.isActive,
        },
      );

      if (!updatedCustomer) {
        throw new NotFoundException('Customer not found');
      }

      return this.findById(tenantId, updatedCustomer.id);
    } catch (error: unknown) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async updateStatus(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<CustomerResponseDto> {
    const updatedCustomer = await this.customersRepository.updateStatus(
      tenantId,
      customerId,
      actorUserId,
      isActive,
    );

    if (!updatedCustomer) {
      throw new NotFoundException('Customer not found');
    }

    return this.findById(tenantId, updatedCustomer.id);
  }

  async uploadLogo(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
  ): Promise<CustomerResponseDto> {
    const current = await this.requireCustomer(tenantId, customerId);
    const uploaded = await this.mediaService.uploadImage(file, 'customers');

    try {
      const updated = await this.customersRepository.update(
        tenantId,
        customerId,
        actorUserId,
        {
          logoUrl: uploaded.url,
          logoFileName: uploaded.fileName,
          logoMimeType: uploaded.mimeType,
          logoSize: uploaded.size,
        },
      );

      if (!updated) {
        throw new NotFoundException('Customer not found');
      }

      await this.mediaService.deleteImage(current.logoUrl);
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }

    return this.findById(tenantId, customerId);
  }

  async remove(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    password: string,
  ): Promise<{ success: true }> {
    await this.assertDeletePassword(tenantId, actorUserId, password);
    const current = await this.requireCustomer(tenantId, customerId);
    const deleted = await this.customersRepository.softDelete(
      tenantId,
      customerId,
      actorUserId,
    );

    if (!deleted) {
      throw new NotFoundException('Customer not found');
    }

    await this.mediaService.deleteImage(current.logoUrl);
    return { success: true };
  }

  async importCsv(
    tenantId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Select a CSV file to import');
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files can be imported');
    }

    const rows = parseCustomerCsv(file.buffer);
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        await this.create(tenantId, actorUserId, {
          name: row.name,
          address: row.address,
          taxNumber: row.taxNumber,
          contactPerson: row.contactPerson,
          phone: row.phone,
          email: row.email,
        });
        imported += 1;
      } catch (error: unknown) {
        if (error instanceof ConflictException) {
          skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return { imported, skipped };
  }

  sampleCsv() {
    return {
      fileName: 'client_template.csv',
      content: CLIENT_SAMPLE_CSV,
    };
  }

  private async requireCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<SalesCustomer> {
    const customer = await this.customersRepository.findById(
      tenantId,
      customerId,
    );

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  private async assertDeletePassword(
    organizationId: string,
    actorUserId: string,
    password: string,
  ): Promise<void> {
    const user = await this.usersService.findByIdAndOrganization(
      actorUserId,
      organizationId,
    );

    if (!user || !user.isActive || !DELETE_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'Only Super Admin accounts can delete clients',
      );
    }

    if (!(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect password.');
    }
  }

  private async ensureCustomerCodeAvailable(
    tenantId: string,
    customerCode: string,
  ): Promise<void> {
    const existingCustomer = await this.customersRepository.findByCode(
      tenantId,
      customerCode,
    );

    if (existingCustomer) {
      throw new ConflictException('A customer with this code already exists');
    }
  }

  private async ensureNameAvailable(
    tenantId: string,
    name: string,
    excludingId?: string,
  ): Promise<void> {
    const existing = await this.customersRepository.findByName(
      tenantId,
      name,
      excludingId,
    );

    if (existing) {
      throw new ConflictException('A client with this name already exists');
    }
  }

  private async ensureTaxNumberAvailable(
    tenantId: string,
    taxNumber: string,
    excludingId?: string,
  ): Promise<void> {
    const existing = await this.customersRepository.findByTaxNumber(
      tenantId,
      taxNumber,
      excludingId,
    );

    if (existing) {
      throw new ConflictException(
        'A client with this VAT/PAN number already exists',
      );
    }
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (this.getDatabaseErrorCode(error) !== '23505') {
      return;
    }

    throw new ConflictException(
      'A client with this name, code, or VAT/PAN number already exists',
    );
  }

  private normalizeCustomerCode(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalEmail(
    value: string | null | undefined,
  ): string | undefined {
    const normalized = this.normalizeOptionalText(value);

    return normalized?.toLowerCase();
  }

  private normalizeOptionalNullableText(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOptionalNullableEmail(
    value: string | null | undefined,
  ): string | null | undefined {
    const normalized = this.normalizeOptionalNullableText(value);

    return typeof normalized === 'string'
      ? normalized.toLowerCase()
      : normalized;
  }

  private getDatabaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const record = error as {
      code?: unknown;
      cause?: unknown;
    };

    if (typeof record.code === 'string') {
      return record.code;
    }

    if (
      typeof record.cause === 'object' &&
      record.cause !== null &&
      'code' in record.cause
    ) {
      const cause = record.cause as {
        code?: unknown;
      };

      if (typeof cause.code === 'string') {
        return cause.code;
      }
    }

    return undefined;
  }
}
