import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  CreateInvoiceDto,
  ListInvoicesQueryDto,
  RecordPaymentDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Finance - Invoices')
@ApiBearerAuth()
@AuditEntity('finance.invoice')
@Controller({ path: 'finance/invoices', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListInvoicesQueryDto,
  ) {
    return this.service.list(request.user.organizationId, query);
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.service.summary(request.user.organizationId);
  }

  @Get(':id')
  findDetails(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.findDetails(request.user.organizationId, id);
  }

  @Post()
  generate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.service.generate(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Post(':id/payments')
  recordPayment(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.service.recordPayment(
      request.user.organizationId,
      request.user.sub,
      id,
      dto,
    );
  }
}
