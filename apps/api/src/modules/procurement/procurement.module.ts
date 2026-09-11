import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { GuaranteesController } from './guarantees.controller';
import { ProcurementRepository } from './procurement.repository';
import { ProcurementService } from './procurement.service';
import { TendersController } from './tenders.controller';

@Module({
  imports: [MediaModule],
  controllers: [TendersController, GuaranteesController],
  providers: [ProcurementRepository, ProcurementService],
})
export class ProcurementModule {}
