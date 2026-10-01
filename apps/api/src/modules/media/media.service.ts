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

    assertFileSignature(file.buffer, file.mimetype);

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

    assertFileSignature(file.buffer, file.mimetype);

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

    const disposition =
      parsed.mimeType === 'application/pdf' ? 'attachment' : 'inline';

    return new StreamableFile(createReadStream(absolutePath), {
      type: parsed.mimeType,
      disposition: `${disposition}; filename="${parsed.fileName}"`,
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

function assertFileSignature(buffer: Buffer, mimeType: string): void {
  const matches =
    (mimeType === 'image/png' &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )) ||
    (mimeType === 'image/jpeg' &&
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff) ||
    (mimeType === 'image/webp' &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP') ||
    (mimeType === 'application/pdf' &&
      buffer.subarray(0, 5).toString('ascii') === '%PDF-');

  if (!matches) {
    throw new BadRequestException(
      'File contents do not match the declared type',
    );
  }
}
