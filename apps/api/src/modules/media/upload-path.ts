import { MEDIA_FOLDERS, type MediaFolder } from './constants';

const UUID_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export interface StoredUploadPath {
  folder: MediaFolder;
  fileName: string;
  relativePath: string;
  mimeType: string;
}

export function parseStoredUploadPath(
  value: string | null | undefined,
): StoredUploadPath | null {
  if (!value) {
    return null;
  }

  const relative = value
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/uploads\//, '')
    .replace(/^\/+/, '');

  if (relative.includes('..') || relative.includes('\\')) {
    return null;
  }

  const separator = relative.indexOf('/');

  if (separator <= 0 || separator === relative.length - 1) {
    return null;
  }

  const folder = relative.slice(0, separator);
  const fileName = relative.slice(separator + 1);

  if (
    !MEDIA_FOLDERS.includes(folder as MediaFolder) ||
    fileName.includes('/') ||
    !UUID_FILE.test(fileName)
  ) {
    return null;
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  return {
    folder: folder as MediaFolder,
    fileName,
    relativePath: `${folder}/${fileName}`,
    mimeType: MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
  };
}

/* Stored guarantee proofs must stay inside the procurement uploads folder. */
export const PROCUREMENT_DOCUMENT_URL_PATTERN =
  /^\/uploads\/procurement\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpe?g)$/i;
