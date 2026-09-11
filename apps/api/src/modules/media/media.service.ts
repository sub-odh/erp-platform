import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_DOCUMENT_ALLOWED_MIME_TYPES,
  MEDIA_MAX_DOCUMENT_SIZE,
  MEDIA_MAX_FILE_SIZE,
  type MediaFolder,
} from './constants';
import { MediaResponseDto } from './dto/media-response.dto';
import { LocalStorageService } from './storage/local-storage.service';
import { parseStoredUploadPath } from './upload-path';

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

  async uploadDocument(
    file: Express.Multer.File | undefined,
    folder: MediaFolder,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    if (
      !MEDIA_DOCUMENT_ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof MEDIA_DOCUMENT_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException('Only PDF, PNG, and JPEG files are allowed');
    }

    if (file.size > MEDIA_MAX_DOCUMENT_SIZE) {
      throw new BadRequestException('Document must not exceed 5 MB');
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

  async streamStoredFile(
    folder: string,
    fileName: string,
  ): Promise<StreamableFile> {
    const parsed = parseStoredUploadPath(`/uploads/${folder}/${fileName}`);

    if (!parsed) {
      throw new NotFoundException('File was not found');
    }

    const absolutePath = this.localStorageService.resolveExistingPath(
      parsed.relativePath,
    );

    try {
      await access(absolutePath, constants.R_OK);
    } catch {
      throw new NotFoundException('File was not found');
    }

    return new StreamableFile(createReadStream(absolutePath), {
      type: parsed.mimeType,
      disposition: `inline; filename="${parsed.fileName}"`,
    });
  }

  deleteImage(relativePath: string | null | undefined): Promise<void> {
    return this.localStorageService.deleteFile(
      this.normalizeStoredPath(relativePath),
    );
  }

  private normalizeStoredPath(value: string | null | undefined): string | null {
    return parseStoredUploadPath(value)?.relativePath ?? null;
  }
}
