import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
  DispatchProformaInvoiceDto,
  ListProformaInvoicesQueryDto,
  PurgeProformaInvoiceDto,
  SaveProformaInvoiceDto,
} from './dto/proforma-invoice.dto';
import { ProformaInvoicesService } from './proforma-invoices.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Proforma Invoices')
@ApiBearerAuth()
@AuditEntity('sales.proforma-invoice')
@Controller({ path: 'sales/proforma-invoices', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class ProformaInvoicesController {
  constructor(private readonly service: ProformaInvoicesService) {}

  @Get('draft')
  draft(@Req() request: AuthenticatedRequest) {
    return this.service.draft(request.user.organizationId, request.user.sub);
  }

  @Post('dispatch-email')
  dispatch(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DispatchProformaInvoiceDto,
  ) {
    return this.service.dispatch(request.user.organizationId, dto);
  }

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListProformaInvoicesQueryDto,
  ) {
    return this.service.list(request.user.organizationId, query);
  }

  @Get(':id')
  findDetails(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.findDetails(request.user.organizationId, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveProformaInvoiceDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Put(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveProformaInvoiceDto,
  ) {
    return this.service.update(request.user.organizationId, id, dto);
  }

  @Post(':id/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PurgeProformaInvoiceDto,
  ) {
    return this.service.purge(
      request.user.organizationId,
      request.user.sub,
      id,
      dto.password,
    );
  }
}
