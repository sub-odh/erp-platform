import { Injectable } from '@nestjs/common';

import type { PaginatedResult } from '../../../common/pagination';
import { CreateCustomerDto } from './dto/create-customer.dto';
import type { CustomerHistoryResponseDto } from './dto/customer-history-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Injectable()
export class CustomersFacade {
  constructor(private readonly customersService: CustomersService) {}

  list(
    tenantId: string,
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    return this.customersService.list(tenantId, query);
  }

  findById(tenantId: string, customerId: string): Promise<CustomerResponseDto> {
    return this.customersService.findById(tenantId, customerId);
  }

  history(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerHistoryResponseDto> {
    return this.customersService.history(tenantId, customerId);
  }

  create(
    tenantId: string,
    actorUserId: string,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(
      tenantId,
      actorUserId,
      createCustomerDto,
    );
  }

  update(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(
      tenantId,
      customerId,
      actorUserId,
      updateCustomerDto,
    );
  }

  updateStatus(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<CustomerResponseDto> {
    return this.customersService.updateStatus(
      tenantId,
      customerId,
      actorUserId,
      isActive,
    );
  }

  uploadLogo(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
  ): Promise<CustomerResponseDto> {
    return this.customersService.uploadLogo(
      tenantId,
      customerId,
      actorUserId,
      file,
    );
  }

  remove(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    password: string,
  ): Promise<{ success: true }> {
    return this.customersService.remove(
      tenantId,
      customerId,
      actorUserId,
      password,
    );
  }

  importCsv(
    tenantId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
  ) {
    return this.customersService.importCsv(tenantId, actorUserId, file);
  }

  sampleCsv() {
    return this.customersService.sampleCsv();
  }
}
