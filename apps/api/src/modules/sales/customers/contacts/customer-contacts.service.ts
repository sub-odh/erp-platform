import { Injectable, NotFoundException } from '@nestjs/common';

import { CustomerContactResponseDto } from './dto/customer-contact-response.dto';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

import { CustomerContactsRepository } from './customer-contacts.repository';

@Injectable()
export class CustomerContactsService {
  constructor(
    private readonly customerContactsRepository: CustomerContactsRepository,
  ) {}

  async list(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerContactResponseDto[]> {
    await this.ensureCustomerExists(tenantId, customerId);

    const contacts = await this.customerContactsRepository.list(
      tenantId,
      customerId,
    );

    return contacts.map((contact) =>
      CustomerContactResponseDto.fromEntity(contact),
    );
  }

  async create(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    dto: CreateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    await this.ensureCustomerExists(tenantId, customerId);

    const contact = await this.customerContactsRepository.create({
      tenantId,
      customerId,
      actorUserId,

      firstName: dto.firstName.trim(),

      lastName: dto.lastName.trim(),

      jobTitle: this.normalizeOptionalText(dto.jobTitle),

      email: this.normalizeOptionalEmail(dto.email),

      phone: this.normalizeOptionalText(dto.phone),

      mobile: this.normalizeOptionalText(dto.mobile),

      isPrimary: dto.isPrimary,

      isActive: dto.isActive,
    });

    return CustomerContactResponseDto.fromEntity(contact);
  }

  async update(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    dto: UpdateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    await this.ensureCustomerExists(tenantId, customerId);

    const existing = await this.customerContactsRepository.findById(
      tenantId,
      customerId,
      contactId,
    );

    if (!existing) {
      throw new NotFoundException('Customer contact not found');
    }

    const updated = await this.customerContactsRepository.update(
      tenantId,
      customerId,
      contactId,
      actorUserId,
      {
        firstName:
          dto.firstName !== undefined ? dto.firstName.trim() : undefined,

        lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,

        jobTitle: this.normalizeOptionalNullableText(dto.jobTitle),

        email: this.normalizeOptionalNullableEmail(dto.email),

        phone: this.normalizeOptionalNullableText(dto.phone),

        mobile: this.normalizeOptionalNullableText(dto.mobile),

        isPrimary: dto.isPrimary,

        isActive: dto.isActive,
      },
    );

    if (!updated) {
      throw new NotFoundException('Customer contact not found');
    }

    return CustomerContactResponseDto.fromEntity(updated);
  }

  async updateStatus(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<CustomerContactResponseDto> {
    await this.ensureCustomerExists(tenantId, customerId);

    const updated = await this.customerContactsRepository.updateStatus(
      tenantId,
      customerId,
      contactId,
      actorUserId,
      isActive,
    );

    if (!updated) {
      throw new NotFoundException('Customer contact not found');
    }

    return CustomerContactResponseDto.fromEntity(updated);
  }

  async archive(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.ensureCustomerExists(tenantId, customerId);

    const archived = await this.customerContactsRepository.archive(
      tenantId,
      customerId,
      contactId,
      actorUserId,
    );

    if (!archived) {
      throw new NotFoundException('Customer contact not found');
    }
  }

  private async ensureCustomerExists(
    tenantId: string,
    customerId: string,
  ): Promise<void> {
    const exists = await this.customerContactsRepository.customerExists(
      tenantId,
      customerId,
    );

    if (!exists) {
      throw new NotFoundException('Customer not found');
    }
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
}
