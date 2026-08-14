import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { LicensingGuard } from './licensing.guard';
import { LicensingService } from './licensing.service';

@Global()
@Module({
  providers: [
    LicensingService,
    { provide: APP_GUARD, useClass: LicensingGuard },
  ],
  exports: [LicensingService],
})
export class LicensingModule {}
