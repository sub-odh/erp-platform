import { Module } from '@nestjs/common';

import { OfficeAssetsController } from './office-assets.controller';
import { OfficeAssetsRepository } from './office-assets.repository';
import { OfficeAssetsService } from './office-assets.service';

@Module({
  controllers: [OfficeAssetsController],
  providers: [OfficeAssetsRepository, OfficeAssetsService],
})
export class OfficeAssetsModule {}
