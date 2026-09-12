import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { MEDIA_MAX_DOCUMENT_SIZE } from '../../media/constants';
import { CreateMemoDto } from './dto/memo.dto';
import { MemosService } from './memos.service';

@Controller({
  path: 'hr/memos',
  version: '1',
})
@AuditEntity('hr.memo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemosController {
  constructor(private readonly memosService: MemosService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.memosService.list(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMemoDto) {
    return this.memosService.create(user.organizationId, user.sub, dto);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.findById(user.organizationId, memoId);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.verify(
      user.organizationId,
      user.sub,
      user.role,
      memoId,
    );
  }

  @Post(':id/confirm')
  @RequirePermissions(PERMISSIONS.HR_MEMOS_MANAGE)
  @HttpCode(HttpStatus.OK)
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.confirm(user.organizationId, user.sub, memoId);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.HR_MEMOS_MANAGE)
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.approve(user.organizationId, user.sub, memoId);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.HR_MEMOS_MANAGE)
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.reject(user.organizationId, user.sub, memoId);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_DOCUMENT_SIZE },
    }),
  )
  addAttachment(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.memosService.addAttachment(
      user.organizationId,
      user.sub,
      user.role,
      memoId,
      file,
    );
  }
}
