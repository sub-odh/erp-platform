import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { CustomersFacade } from './customers.facade';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller({
  path: 'sales/customers',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersFacade: CustomersFacade) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersFacade.list(request.user.organizationId, query);
  }

  @Get(':customerId')
  findById(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
  ) {
    return this.customersFacade.findById(
      request.user.organizationId,
      customerId,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersFacade.create(
      request.user.organizationId,
      request.user.sub,
      createCustomerDto,
    );
  }

  @Patch(':customerId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersFacade.update(
      request.user.organizationId,
      customerId,
      request.user.sub,
      updateCustomerDto,
    );
  }

  @Patch(':customerId/status')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @Body()
    updateCustomerStatusDto: UpdateCustomerStatusDto,
  ) {
    return this.customersFacade.updateStatus(
      request.user.organizationId,
      customerId,
      request.user.sub,
      updateCustomerStatusDto.isActive,
    );
  }
}
