import { BadRequestException, Injectable } from '@nestjs/common';

import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_FILE_SIZE,
  type MediaFolder,
} from './constants';
import { MediaResponseDto } from './dto/media-response.dto';
import { LocalStorageService } from './storage/local-storage.service';

@Injectable()
export class MediaService {
  constructor(private readonly localStorageService: LocalStorageService) {}

  async uploadImage(
    file: Express.Multer.File | undefined,
    folder: MediaFolder,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (
      !MEDIA_ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof MEDIA_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException(
        'Only PNG, JPEG, and WebP images are allowed',
      );
    }

    if (file.size > MEDIA_MAX_FILE_SIZE) {
      throw new BadRequestException('Image must not exceed 2 MB');
    }

    const saved = await this.localStorageService.saveFile({
      folder,
      originalName: file.originalname,
      buffer: file.buffer,
    });

    return {
      url: `/uploads/${saved.relativePath}`,
      fileName: saved.fileName,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  deleteImage(relativePath: string | null | undefined): Promise<void> {
    return this.localStorageService.deleteFile(
      this.normalizeStoredPath(relativePath),
    );
  }

  private normalizeStoredPath(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/uploads\//, '');
  }
}
