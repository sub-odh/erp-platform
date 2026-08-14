# Session and Token Security

## Token model

The application uses two tokens with different exposure and lifetime profiles:

- the short-lived access token is returned to the frontend and sent in the `Authorization: Bearer` header;
- the long-lived refresh token is stored only in an HttpOnly browser cookie and is never returned in a JSON response.

The refresh token is hashed with SHA-256 before its session record is stored. The plaintext token exists only in the signed token and browser cookie.

## Refresh cookie

Cookie name: `erp_refresh_token`

Security attributes:

- `HttpOnly` prevents JavaScript access;
- `Secure` is enabled in production;
- `SameSite=Lax` limits cross-site request attachment;
- `Path=/api/v1/auth` prevents the browser from attaching the token to unrelated API routes;
- `Max-Age` matches the configured refresh-token lifetime.

The frontend must use `credentials: "include"` for API calls that issue, rotate, or clear the cookie.

## Lifecycle

### Login

1. Credentials are verified.
2. The API creates a hashed refresh session.
3. The access token is returned in JSON.
4. The refresh token is written as an HttpOnly cookie.

### Refresh

1. The browser sends the refresh cookie.
2. The API verifies the signature, token type, session hash, expiry, and tenant.
3. The old token hash is atomically replaced.
4. A new access token is returned and the rotated refresh token replaces the cookie.

Concurrent frontend refresh attempts share one promise, reducing accidental reuse failures.

### Logout and revocation

- logout revokes the current session and clears the cookie;
- logout-all increments the user's token version, revokes all sessions, and clears the cookie;
- password changes revoke all sessions and clear the cookie;
- invalid refresh attempts clear the unusable cookie.

## Frontend storage

The frontend no longer stores or reads refresh tokens from `localStorage`. Session save and clear operations remove the legacy `erp.refreshToken` key left by older builds.

The access token remains in `localStorage` for the current milestone. Its short lifetime limits exposure, but moving it to memory with a refresh-on-bootstrap flow would further reduce XSS impact and should be considered in a later frontend-security milestone.

## CSRF and deployment assumptions

Refresh and logout cookies use `SameSite=Lax`, which is suitable when the frontend and API are served from the same site, including the intended Nginx deployment. If a future deployment places them on different sites and requires `SameSite=None`, it must also add explicit CSRF tokens and strict origin validation before changing the cookie policy.

CORS must use an explicit trusted origin with credentials enabled. Wildcard origins must never be combined with credentialed requests.
