import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const BLOCKED_HOST_NAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
]);

export async function assertSafeSmtpHost(host: string): Promise<void> {
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');

  if (!normalized) {
    throw new Error('SMTP host is required');
  }

  if (
    BLOCKED_HOST_NAMES.has(normalized) ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.internal')
  ) {
    throw new Error('SMTP host is not allowed');
  }

  if (isIP(normalized)) {
    if (isBlockedAddress(normalized)) {
      throw new Error('SMTP host is not allowed');
    }

    return;
  }

  const records = await lookup(normalized, { all: true, verbatim: true });

  if (records.some((record) => isBlockedAddress(record.address))) {
    throw new Error('SMTP host is not allowed');
  }
}

export function isBlockedAddress(address: string): boolean {
  if (address.includes(':')) {
    const mapped = ipv4Mapped(address);

    if (mapped) {
      return isBlockedIpv4(mapped);
    }

    const compact = address.toLowerCase();

    return (
      compact === '::1' ||
      compact === '::' ||
      compact.startsWith('fe80:') ||
      compact.startsWith('fc') ||
      compact.startsWith('fd')
    );
  }

  return isBlockedIpv4(address);
}

function ipv4Mapped(address: string): string | null {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);

  return match?.[1] ?? null;
}

function isBlockedIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return true;
  }

  const [a, b] = octets;

  /* Loopback, link-local / cloud metadata, and unspecified — not RFC1918, so
     on-prem mail servers on 10/8 and 192.168/16 still work. */
  return (
    a === 0 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    a === 255
  );
}
