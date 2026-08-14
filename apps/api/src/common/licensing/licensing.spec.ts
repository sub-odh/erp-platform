import { generateKeyPairSync, sign } from 'node:crypto';

import {
  canonicalJson,
  evaluateLicense,
  verifySignedLicense,
  type LicensePayload,
} from '@erp/licensing';

describe('offline licensing', () => {
  const payload: LicensePayload = {
    licenseId: 'license-1',
    tenantId: 'tenant-1',
    customer: 'Example',
    licensedModules: ['admin', 'sales'],
    validUntil: '2026-08-31',
    maxUsers: 25,
    issuedAt: '2026-01-01',
  };

  it('verifies a canonical RS256 signature', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(canonicalJson(payload)),
      privateKey,
    ).toString('base64');

    expect(
      verifySignedLicense(
        { ...payload, signature },
        publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      ),
    ).toEqual(payload);
  });

  it('rejects a modified signed payload', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(canonicalJson(payload)),
      privateKey,
    ).toString('base64');

    expect(() =>
      verifySignedLicense(
        { ...payload, maxUsers: 999, signature },
        publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      ),
    ).toThrow('signature is invalid');
  });

  it('moves an expired license through read-only grace to blocked', () => {
    expect(evaluateLicense(payload, new Date('2026-09-03')).status).toBe(
      'read_only',
    );
    expect(evaluateLicense(payload, new Date('2026-09-09')).status).toBe(
      'blocked',
    );
  });
});
