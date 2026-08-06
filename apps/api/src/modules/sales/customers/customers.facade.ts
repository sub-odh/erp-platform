import { Injectable } from '@nestjs/common';

import type { PaginatedResult } from '../../../common/pagination';
import { CreateCustomerDto } from './dto/create-customer.dto';
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
}
