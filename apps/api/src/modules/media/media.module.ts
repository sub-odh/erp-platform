import { Module } from '@nestjs/common';

import { MediaService } from './media.service';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  providers: [MediaService, LocalStorageService],
  exports: [MediaService],
})
export class MediaModule {}
