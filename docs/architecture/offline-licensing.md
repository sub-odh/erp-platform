# Offline licensing

The API verifies an on-disk JSON license with an RSA public key. Verification is local and does not require internet access.

## Configuration

Set `LICENSE_PATH` and `LICENSE_PUBLIC_KEY_PATH` to the signed JSON document and PEM-encoded RSA public key. Relative paths are resolved from the API process working directory. Production startup fails when either file is missing or the signature/document is invalid. Development and test environments use a clearly logged, unrestricted local fallback only when both files are absent.

The signed payload contains `licenseId`, `tenantId`, `customer`, `licensedModules`, `validUntil`, `maxUsers`, and `issuedAt`. Its `signature` is base64-encoded RSA-SHA256 over the canonical JSON representation of the payload (all object keys sorted recursively, with `signature` excluded).

## Enforcement

- The authenticated organization must match `tenantId`.
- CRM endpoints require the `sales` entitlement; user, organization, and audit administration require `admin`.
- Creating or reactivating a user is rejected once the active-user count reaches `maxUsers`.
- During the final 30 days the status is `warning`.
- From expiry through the seven-day grace period the API is `read_only`: reads and authentication continue, while mutations are rejected.
- After grace ends the authenticated API is blocked until a valid replacement license is installed.

Login and refresh responses include a non-sensitive license summary so the web application can show status and licensed modules. The private signing key must never be deployed with the application.

## Renewal

Replace the license JSON atomically with a newly signed document and restart the API. Confirm the startup log reports the expected license identifier and state. Keep the previous license outside the application directory for rollback; never edit a signed document because any change invalidates its signature.
