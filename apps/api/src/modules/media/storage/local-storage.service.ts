import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { MediaFolder } from '../constants';

interface SaveFileInput {
  folder: MediaFolder;
  originalName: string;
  buffer: Buffer;
}

interface SavedFile {
  fileName: string;
  relativePath: string;
}

@Injectable()
export class LocalStorageService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async saveFile(input: SaveFileInput): Promise<SavedFile> {
    const extension = this.getSafeExtension(input.originalName);

    const fileName = `${randomUUID()}${extension}`;

    const targetDirectory = join(this.uploadsRoot, input.folder);

    const targetPath = join(targetDirectory, fileName);

    try {
      await mkdir(targetDirectory, {
        recursive: true,
      });

      await writeFile(targetPath, input.buffer);
    } catch {
      throw new InternalServerErrorException('Unable to store uploaded file');
    }

    return {
      fileName,
      relativePath: `${input.folder}/${fileName}`,
    };
  }

  async deleteFile(relativePath: string | null | undefined): Promise<void> {
    if (!relativePath) {
      return;
    }

    const safeRelativePath = relativePath.replace(/^\/+/, '');

    const targetPath = join(this.uploadsRoot, safeRelativePath);

    try {
      await unlink(targetPath);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }

      throw new InternalServerErrorException('Unable to delete stored file');
    }
  }

  private getSafeExtension(originalName: string): string {
    const extension = extname(originalName).toLowerCase();

    if (
      extension === '.png' ||
      extension === '.jpg' ||
      extension === '.jpeg' ||
      extension === '.webp'
    ) {
      return extension === '.jpeg' ? '.jpg' : extension;
    }

    return '';
  }
}
