export const MEDIA_MAX_FILE_SIZE = 2 * 1024 * 1024;

export const MEDIA_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type MediaMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];

export const MEDIA_FOLDERS = [
  'company',
  // Retained so existing company logos in /uploads/organizations keep working.
  'organizations',
  'users',
  'products',
  'customers',
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
