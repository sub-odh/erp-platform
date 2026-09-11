import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@Controller({ path: 'media', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':folder/:fileName')
  stream(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
  ) {
    return this.mediaService.streamStoredFile(folder, fileName);
  }
}
