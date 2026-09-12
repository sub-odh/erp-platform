import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { MEDIA_MAX_FILE_SIZE } from '../../media/constants';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { PartnersService } from './partners.service';

@Controller({
  path: 'hr/partners',
  version: '1',
})
@AuditEntity('hr.partner')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.HR_PARTNERS_MANAGE)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.partnersService.list(user.organizationId);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) partnerId: string,
  ) {
    return this.partnersService.findById(user.organizationId, partnerId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePartnerDto) {
    return this.partnersService.create(user.organizationId, user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) partnerId: string,
    @Body() dto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(user.organizationId, partnerId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) partnerId: string,
  ) {
    return this.partnersService.remove(user.organizationId, partnerId);
  }

  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  uploadLogo(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) partnerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.partnersService.uploadLogo(
      user.organizationId,
      partnerId,
      file,
    );
  }
}
