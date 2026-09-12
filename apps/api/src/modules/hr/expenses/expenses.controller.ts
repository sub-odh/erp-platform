import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { CreateTadaDto, ReviewTadaDto } from './dto/expense.dto';
import { ExpensesService } from './expenses.service';

@Controller({
  path: 'hr/tada',
  version: '1',
})
@AuditEntity('hr.expense')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  list(@CurrentUser() user: JwtPayload) {
    return this.expensesService.list(user.organizationId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.expensesService.listMine(user.organizationId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTadaDto) {
    return this.expensesService.create(user.organizationId, user.sub, dto);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) expenseId: string,
    @Body() dto: ReviewTadaDto,
  ) {
    return this.expensesService.approve(
      user.organizationId,
      user.sub,
      expenseId,
      dto,
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) expenseId: string,
    @Body() dto: ReviewTadaDto,
  ) {
    return this.expensesService.reject(
      user.organizationId,
      user.sub,
      expenseId,
      dto,
    );
  }
}
