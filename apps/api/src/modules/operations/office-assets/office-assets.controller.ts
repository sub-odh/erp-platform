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
  UseGuards,
} from '@nestjs/common';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { SaveOfficeAssetDto } from './dto/save-office-asset.dto';
import { OfficeAssetsService } from './office-assets.service';

@Controller({
  path: 'operations/office-assets',
  version: '1',
})
@AuditEntity('operations.office-asset')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OfficeAssetsController {
  constructor(private readonly officeAssetsService: OfficeAssetsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.officeAssetsService.list(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: SaveOfficeAssetDto) {
    return this.officeAssetsService.create(
      user.organizationId,
      user.sub,
      dto,
    );
  }

  @Patch(':assetId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: SaveOfficeAssetDto,
  ) {
    return this.officeAssetsService.update(
      user.organizationId,
      user.sub,
      assetId,
      dto,
    );
  }

  @Delete(':assetId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
  ) {
    return this.officeAssetsService.remove(user.organizationId, assetId);
  }
}
