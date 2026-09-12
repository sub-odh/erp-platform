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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller({
  path: 'hr/employees',
  version: '1',
})
@AuditEntity('hr.employee')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  list(@CurrentUser() user: JwtPayload, @Query() query: ListEmployeesQueryDto) {
    return this.employeesService.list(user.organizationId, query);
  }

  @Get('lookups')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  lookups(
    @CurrentUser() user: JwtPayload,
    @Query('excludeEmployeeId') excludeEmployeeId?: string,
  ) {
    return this.employeesService.lookups(
      user.organizationId,
      excludeEmployeeId,
    );
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.employeesService.findMe(user.organizationId, user.sub);
  }

  @Get('directory')
  directory(@CurrentUser() user: JwtPayload) {
    return this.employeesService.directory(user.organizationId);
  }

  @Get(':employeeId')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  findById(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.findById(user.organizationId, employeeId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user.organizationId, user.sub, dto);
  }

  @Patch(':employeeId')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(
      user.organizationId,
      user.sub,
      employeeId,
      dto,
    );
  }

  @Post(':employeeId/deactivate')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.deactivate(
      user.organizationId,
      user.sub,
      employeeId,
    );
  }

  @Post(':employeeId/restore')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  @HttpCode(HttpStatus.OK)
  restore(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.restore(
      user.organizationId,
      user.sub,
      employeeId,
    );
  }

  @Post(':employeeId/photo')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.employeesService.uploadPhoto(
      user.organizationId,
      user.sub,
      employeeId,
      file,
    );
  }

  @Delete(':employeeId/photo')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  removePhoto(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.removePhoto(
      user.organizationId,
      user.sub,
      employeeId,
    );
  }

  @Post(':employeeId/signature')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  uploadSignature(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.employeesService.uploadSignature(
      user.organizationId,
      user.sub,
      employeeId,
      file,
    );
  }

  @Delete(':employeeId/signature')
  @RequirePermissions(PERMISSIONS.HR_EMPLOYEES_MANAGE)
  removeSignature(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.removeSignature(
      user.organizationId,
      user.sub,
      employeeId,
    );
  }
}
