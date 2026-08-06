import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../../common/pagination';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async list(
    tenantId: string,
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    const result = await this.customersRepository.list({
      tenantId,
      search: query.search,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });

    return createPaginatedResult(
      result.data.map((customer) => CustomerResponseDto.fromEntity(customer)),
      query.page,
      query.limit,
      result.total,
    );
  }

  async findById(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersRepository.findById(
      tenantId,
      customerId,
    );

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return CustomerResponseDto.fromEntity(customer);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customerCode = this.normalizeCustomerCode(
      createCustomerDto.customerCode,
    );

    await this.ensureCustomerCodeAvailable(tenantId, customerCode);

    try {
      const createdCustomer = await this.customersRepository.create({
        tenantId,
        actorUserId,
        customerCode,
        name: createCustomerDto.name.trim(),
        legalName: this.normalizeOptionalText(createCustomerDto.legalName),
        taxNumber: this.normalizeOptionalText(createCustomerDto.taxNumber),
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

      return CustomerResponseDto.fromEntity(createdCustomer);
    } catch (error: unknown) {
      if (this.getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException('A customer with this code already exists');
      }

      throw error;
    }
  }

  async update(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const existingCustomer = await this.customersRepository.findById(
      tenantId,
      customerId,
    );

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

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
          taxNumber: this.normalizeOptionalNullableText(
            updateCustomerDto.taxNumber,
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

      return CustomerResponseDto.fromEntity(updatedCustomer);
    } catch (error: unknown) {
      if (this.getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException('A customer with this code already exists');
      }

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

    return CustomerResponseDto.fromEntity(updatedCustomer);
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

  private normalizeCustomerCode(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalEmail(
    value: string | undefined,
  ): string | undefined {
    const normalized = this.normalizeOptionalText(value);

    return normalized?.toLowerCase();
  }

  private normalizeOptionalNullableText(
    value: string | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOptionalNullableEmail(
    value: string | undefined,
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
