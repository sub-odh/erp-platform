import { createPublicKey, verify } from "node:crypto";

export interface LicensePayload {
  licenseId: string;
  tenantId: string;
  customer: string;
  licensedModules: string[];
  validUntil: string;
  maxUsers: number;
  issuedAt: string;
}

export interface SignedLicense extends LicensePayload {
  signature: string;
}

export type LicenseStatus =
  | "valid"
  | "warning"
  | "read_only"
  | "blocked";

export interface EvaluatedLicense extends LicensePayload {
  status: LicenseStatus;
  daysUntilExpiry: number;
  graceEndsAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_DAYS = 30;
const GRACE_DAYS = 7;

export function verifySignedLicense(
  document: unknown,
  publicKeyPem: string,
): LicensePayload {
  const signedLicense = parseSignedLicense(document);
  const { signature, ...payload } = signedLicense;
  const signatureBytes = Buffer.from(signature, "base64");
  const payloadBytes = Buffer.from(canonicalJson(payload), "utf8");
  const publicKey = createPublicKey(publicKeyPem);
  const isValid = verify("RSA-SHA256", payloadBytes, publicKey, signatureBytes);

  if (!isValid) {
    throw new Error("License signature is invalid");
  }

  return payload;
}

export function evaluateLicense(
  payload: LicensePayload,
  now = new Date(),
): EvaluatedLicense {
  const validUntil = parseDate(payload.validUntil, "validUntil");
  const issuedAt = parseDate(payload.issuedAt, "issuedAt");

  if (issuedAt.getTime() > now.getTime() + DAY_MS) {
    throw new Error("License issue date is in the future");
  }

  const expiryBoundary = endOfUtcDay(validUntil);
  const graceBoundary = new Date(expiryBoundary.getTime() + GRACE_DAYS * DAY_MS);
  const remainingMs = expiryBoundary.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(remainingMs / DAY_MS);

  let status: LicenseStatus;

  if (remainingMs >= WARNING_DAYS * DAY_MS) {
    status = "valid";
  } else if (remainingMs >= 0) {
    status = "warning";
  } else if (now.getTime() <= graceBoundary.getTime()) {
    status = "read_only";
  } else {
    status = "blocked";
  }

  return {
    ...payload,
    status,
    daysUntilExpiry,
    graceEndsAt: graceBoundary.toISOString(),
  };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function parseSignedLicense(document: unknown): SignedLicense {
  if (!isRecord(document)) {
    throw new Error("License document must be an object");
  }

  const license: SignedLicense = {
    licenseId: readString(document, "licenseId"),
    tenantId: readString(document, "tenantId"),
    customer: readString(document, "customer"),
    licensedModules: readStringArray(document, "licensedModules"),
    validUntil: readString(document, "validUntil"),
    maxUsers: readPositiveInteger(document, "maxUsers"),
    issuedAt: readString(document, "issuedAt"),
    signature: readString(document, "signature"),
  };

  if (new Set(license.licensedModules).size !== license.licensedModules.length) {
    throw new Error("licensedModules contains duplicate entries");
  }

  parseDate(license.validUntil, "validUntil");
  parseDate(license.issuedAt, "issuedAt");

  return license;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`License ${key} must be a non-empty string`);
  }

  return value.trim();
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const value = record[key];

  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "string" || entry.trim() === "")
  ) {
    throw new Error(`License ${key} must be a non-empty string array`);
  }

  return value.map((entry) => (entry as string).trim());
}

function readPositiveInteger(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];

  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`License ${key} must be a positive integer`);
  }

  return value as number;
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`License ${field} is not a valid date`);
  }

  return date;
}

function endOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
