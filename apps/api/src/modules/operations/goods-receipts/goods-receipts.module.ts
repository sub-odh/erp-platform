import { Module } from '@nestjs/common';

import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsRepository } from './goods-receipts.repository';
import { GoodsReceiptsService } from './goods-receipts.service';

@Module({
  controllers: [GoodsReceiptsController],
  providers: [GoodsReceiptsRepository, GoodsReceiptsService],
})
export class GoodsReceiptsModule {}
