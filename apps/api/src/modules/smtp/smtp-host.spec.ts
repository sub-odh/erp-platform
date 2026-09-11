import { assertSafeSmtpHost, isBlockedAddress } from './smtp-host';

describe('smtp host guards', () => {
  it('blocks loopback and link-local addresses', () => {
    expect(isBlockedAddress('127.0.0.1')).toBe(true);
    expect(isBlockedAddress('169.254.169.254')).toBe(true);
    expect(isBlockedAddress('::1')).toBe(true);
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows public and RFC1918 mail servers', () => {
    expect(isBlockedAddress('8.8.8.8')).toBe(false);
    expect(isBlockedAddress('10.0.0.12')).toBe(false);
    expect(isBlockedAddress('192.168.1.20')).toBe(false);
  });

  it('rejects localhost by name', async () => {
    await expect(assertSafeSmtpHost('localhost')).rejects.toThrow(
      'SMTP host is not allowed',
    );
  });
});
