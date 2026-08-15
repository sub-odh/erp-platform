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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { CreateInventoryAssetDto } from './dto/create-inventory-asset.dto';
import { ListInventoryAssetsQueryDto } from './dto/list-inventory-assets-query.dto';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import { UpdateInventoryAssetDto } from './dto/update-inventory-asset.dto';
import { InventoryService } from './inventory.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Inventory')
@ApiBearerAuth()
@AuditEntity('operations.inventory-asset')
@RequiresLicense('inventory')
@Controller({ path: 'operations/inventory', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.inventoryService.dashboard(request.user.organizationId);
  }

  @Get('assets')
  listAssets(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListInventoryAssetsQueryDto,
  ) {
    return this.inventoryService.list(request.user.organizationId, query);
  }

  @Get('assets/export')
  exportAssets(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListInventoryAssetsQueryDto,
  ) {
    return this.inventoryService.exportCsv(request.user.organizationId, query);
  }

  @Get('assets/sample')
  sampleCsv() {
    return this.inventoryService.sampleCsv();
  }

  @Get('assets/:assetId')
  findAsset(
    @Req() request: AuthenticatedRequest,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
  ) {
    return this.inventoryService.findById(request.user.organizationId, assetId);
  }

  @Post('assets')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createAsset(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInventoryAssetDto,
  ) {
    return this.inventoryService.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Post('assets/import')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  importAssets(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.inventoryService.importCsv(
      request.user.organizationId,
      request.user.sub,
      file,
    );
  }

  @Patch('assets/:assetId')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateAsset(
    @Req() request: AuthenticatedRequest,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: UpdateInventoryAssetDto,
  ) {
    return this.inventoryService.update(
      request.user.organizationId,
      assetId,
      request.user.sub,
      dto,
    );
  }

  @Delete('assets/:assetId')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveAsset(
    @Req() request: AuthenticatedRequest,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
  ) {
    return this.inventoryService.archive(
      request.user.organizationId,
      assetId,
      request.user.sub,
    );
  }

  @Get('movements')
  listMovements(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListInventoryMovementsQueryDto,
  ) {
    return this.inventoryService.listMovements(
      request.user.organizationId,
      query,
    );
  }
}
