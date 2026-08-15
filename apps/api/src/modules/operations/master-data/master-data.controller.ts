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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateUnitDto,
  CreateVendorDto,
  ListMasterDataQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateUnitDto,
  UpdateVendorDto,
} from './dto/master-data.dto';
import { MasterDataService } from './master-data.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Master Data')
@ApiBearerAuth()
@AuditEntity('operations.master-data')
@RequiresLicense('inventory')
@Controller({ path: 'operations/master-data', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  @Get('options')
  options(@Req() request: AuthenticatedRequest) {
    return this.service.options(request.user.organizationId);
  }

  @Get('categories')
  listCategories(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMasterDataQueryDto,
  ) {
    return this.service.listCategories(request.user.organizationId, query);
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createCategory(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.createCategory(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch('categories/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateCategory(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveCategory(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.archiveCategory(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }

  @Get('units')
  listUnits(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMasterDataQueryDto,
  ) {
    return this.service.listUnits(request.user.organizationId, query);
  }

  @Post('units')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createUnit(@Req() request: AuthenticatedRequest, @Body() dto: CreateUnitDto) {
    return this.service.createUnit(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch('units/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateUnit(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.service.updateUnit(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Delete('units/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveUnit(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.archiveUnit(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }

  @Get('vendors')
  listVendors(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMasterDataQueryDto,
  ) {
    return this.service.listVendors(request.user.organizationId, query);
  }

  @Post('vendors')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createVendor(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateVendorDto,
  ) {
    return this.service.createVendor(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch('vendors/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateVendor(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.service.updateVendor(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Delete('vendors/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveVendor(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.archiveVendor(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }

  @Get('products')
  listProducts(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMasterDataQueryDto,
  ) {
    return this.service.listProducts(request.user.organizationId, query);
  }

  @Post('products')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createProduct(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    return this.service.createProduct(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch('products/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateProduct(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.updateProduct(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Delete('products/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveProduct(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.archiveProduct(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }
}
