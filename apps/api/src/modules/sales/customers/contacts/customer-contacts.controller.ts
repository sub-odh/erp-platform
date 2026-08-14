import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuditEntity } from '../../../../common/audit/audit.decorator';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../../auth/types/jwt-payload.type';

import { CustomerContactsFacade } from './customer-contacts.facade';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { UpdateCustomerContactStatusDto } from './dto/update-customer-contact-status.dto';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller({
  path: 'sales/customers/:customerId/contacts',
  version: '1',
})
@AuditEntity('sales.customer-contact')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class CustomerContactsController {
  constructor(
    private readonly customerContactsFacade: CustomerContactsFacade,
  ) {}

  @Get()
  list(
    @Req()
    request: AuthenticatedRequest,

    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
  ) {
    return this.customerContactsFacade.list(
      request.user.organizationId,
      customerId,
    );
  }

  @Post()
  create(
    @Req()
    request: AuthenticatedRequest,

    @Param('customerId', new ParseUUIDPipe())
    customerId: string,

    @Body()
    dto: CreateCustomerContactDto,
  ) {
    return this.customerContactsFacade.create(
      request.user.organizationId,
      customerId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':contactId')
  update(
    @Req()
    request: AuthenticatedRequest,

    @Param('customerId', new ParseUUIDPipe())
    customerId: string,

    @Param('contactId', new ParseUUIDPipe())
    contactId: string,

    @Body()
    dto: UpdateCustomerContactDto,
  ) {
    return this.customerContactsFacade.update(
      request.user.organizationId,
      customerId,
      contactId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':contactId/status')
  updateStatus(
    @Req()
    request: AuthenticatedRequest,

    @Param('customerId', new ParseUUIDPipe())
    customerId: string,

    @Param('contactId', new ParseUUIDPipe())
    contactId: string,

    @Body()
    dto: UpdateCustomerContactStatusDto,
  ) {
    return this.customerContactsFacade.updateStatus(
      request.user.organizationId,
      customerId,
      contactId,
      request.user.sub,
      dto.isActive,
    );
  }

  @Delete(':contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @Req()
    request: AuthenticatedRequest,

    @Param('customerId', new ParseUUIDPipe())
    customerId: string,

    @Param('contactId', new ParseUUIDPipe())
    contactId: string,
  ): Promise<void> {
    return this.customerContactsFacade.archive(
      request.user.organizationId,
      customerId,
      contactId,
      request.user.sub,
    );
  }
}
