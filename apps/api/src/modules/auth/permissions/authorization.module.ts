import { Global, Module } from '@nestjs/common';

import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  providers: [PermissionsGuard, PermissionsService],
  exports: [PermissionsGuard, PermissionsService],
})
export class AuthorizationModule {}
