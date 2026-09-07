import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  CreateQuotationDto,
  ListQuotationsQueryDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Quotations')
@ApiBearerAuth()
@AuditEntity('sales.quotation')
@Controller({ path: 'sales/quotations', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListQuotationsQueryDto,
  ) {
    return this.service.list(request.user.organizationId, query);
  }

  @Get('next-number')
  nextNumber(
    @Req() request: AuthenticatedRequest,
    @Query('date') date: string,
  ) {
    return this.service.nextNumber(
      request.user.organizationId,
      date || new Date().toISOString().slice(0, 10),
    );
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
    @Body() dto: CreateQuotationDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.remove(
      request.user.organizationId,
      request.user.sub,
      id,
    );
  }
}
