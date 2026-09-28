import {
  Body,
  Controller,
  Delete,
  Get,
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
import { memoryStorage } from 'multer';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { MEDIA_MAX_FILE_SIZE } from '../../media/constants';
import { CustomersFacade } from './customers.facade';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { DeleteCustomerDto } from './dto/delete-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller({
  path: 'sales/customers',
  version: '1',
})
@AuditEntity('sales.customer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class CustomersController {
  constructor(private readonly customersFacade: CustomersFacade) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersFacade.list(request.user.organizationId, query);
  }

  @Get('csv-template')
  sampleCsv() {
    return this.customersFacade.sampleCsv();
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  importCsv(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.customersFacade.importCsv(
      request.user.organizationId,
      request.user.sub,
      file,
    );
  }

  @Get(':customerId/history')
  history(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
  ) {
    return this.customersFacade.history(
      request.user.organizationId,
      customerId,
    );
  }

  @Get(':customerId')
  findById(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
  ) {
    return this.customersFacade.findById(
      request.user.organizationId,
      customerId,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersFacade.create(
      request.user.organizationId,
      request.user.sub,
      createCustomerDto,
    );
  }

  @Patch(':customerId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersFacade.update(
      request.user.organizationId,
      customerId,
      request.user.sub,
      updateCustomerDto,
    );
  }

  @Patch(':customerId/status')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @Body()
    updateCustomerStatusDto: UpdateCustomerStatusDto,
  ) {
    return this.customersFacade.updateStatus(
      request.user.organizationId,
      customerId,
      request.user.sub,
      updateCustomerStatusDto.isActive,
    );
  }

  @Post(':customerId/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  uploadLogo(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.customersFacade.uploadLogo(
      request.user.organizationId,
      customerId,
      request.user.sub,
      file,
    );
  }

  @Delete(':customerId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('customerId', new ParseUUIDPipe())
    customerId: string,
    @Body() dto: DeleteCustomerDto,
  ) {
    return this.customersFacade.remove(
      request.user.organizationId,
      customerId,
      request.user.sub,
      dto.password,
    );
  }
}
