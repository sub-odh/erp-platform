import { Module } from '@nestjs/common';

import { ItemReturnsController } from './item-returns.controller';
import { ItemReturnsRepository } from './item-returns.repository';
import { ItemReturnsService } from './item-returns.service';

@Module({
  controllers: [ItemReturnsController],
  providers: [ItemReturnsRepository, ItemReturnsService],
})
export class ItemReturnsModule {}
