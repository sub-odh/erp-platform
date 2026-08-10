import { Injectable } from '@nestjs/common';

import { CustomerContactsService } from './customer-contacts.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { CustomerContactResponseDto } from './dto/customer-contact-response.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

@Injectable()
export class CustomerContactsFacade {
  constructor(
    private readonly customerContactsService: CustomerContactsService,
  ) {}

  list(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerContactResponseDto[]> {
    return this.customerContactsService.list(tenantId, customerId);
  }

  create(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    dto: CreateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    return this.customerContactsService.create(
      tenantId,
      customerId,
      actorUserId,
      dto,
    );
  }

  update(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    dto: UpdateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    return this.customerContactsService.update(
      tenantId,
      customerId,
      contactId,
      actorUserId,
      dto,
    );
  }

  updateStatus(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<CustomerContactResponseDto> {
    return this.customerContactsService.updateStatus(
      tenantId,
      customerId,
      contactId,
      actorUserId,
      isActive,
    );
  }

  archive(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
  ): Promise<void> {
    return this.customerContactsService.archive(
      tenantId,
      customerId,
      contactId,
      actorUserId,
    );
  }
}
