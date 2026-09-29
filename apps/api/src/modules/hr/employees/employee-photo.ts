import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export function employeeUploadDirectory(): string {
  let dir = process.cwd();

  for (let depth = 0; depth < 6; depth += 1) {
    const publicDir = join(dir, 'apps', 'web', 'public');

    if (existsSync(publicDir)) {
      return join(publicDir, 'assets', 'uploads', 'employees');
    }

    const parent = dirname(dir);

    if (parent === dir) {
      break;
    }

    dir = parent;
  }

  return join(process.cwd(), 'assets', 'uploads', 'employees');
}

export function publicEmployeePhotoPath(stored: string | null): string | null {
  if (!stored) {
    return null;
  }

  if (
    stored.startsWith('http://') ||
    stored.startsWith('https://') ||
    stored.startsWith('/')
  ) {
    return stored;
  }

  if (stored.startsWith('assets/')) {
    return `/${stored}`;
  }

  return stored;
}

export async function writeEmployeePhotoBytes(
  bytes: Buffer,
  mimeType: string,
): Promise<{ url: string; fileName: string; size: number; mimeType: string } | null> {
  if (bytes.length === 0) {
    return null;
  }

  const extension = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : 'jpg';
  const directory = employeeUploadDirectory();
  await mkdir(directory, { recursive: true, mode: 0o755 });

  const fileName = `emp_${Math.floor(Date.now() / 1000)}_${randomBytes(4).toString('hex')}.${extension}`;
  await writeFile(join(directory, fileName), bytes);

  return {
    url: `/assets/uploads/employees/${fileName}`,
    fileName,
    size: bytes.length,
    mimeType,
  };
}

export async function writeEmployeePhoto(
  dataUrlOrBase64: string,
): Promise<{ url: string; fileName: string; size: number; mimeType: string } | null> {
  const match = dataUrlOrBase64.match(
    /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i,
  );
  const payload = match?.[2] ?? dataUrlOrBase64;
  const type = (match?.[1] ?? 'jpeg').toLowerCase();
  const extension = type === 'jpeg' ? 'jpg' : type;

  let bytes: Buffer;

  try {
    bytes = Buffer.from(payload, 'base64');
  } catch {
    return null;
  }

  if (bytes.length === 0) {
    return null;
  }

  const directory = employeeUploadDirectory();
  await mkdir(directory, { recursive: true, mode: 0o755 });

  const fileName = `emp_${Math.floor(Date.now() / 1000)}_${randomBytes(4).toString('hex')}.${extension}`;
  await writeFile(join(directory, fileName), bytes);

  return {
    url: `/assets/uploads/employees/${fileName}`,
    fileName,
    size: bytes.length,
    mimeType: `image/${type === 'jpg' ? 'jpeg' : type}`,
  };
}
