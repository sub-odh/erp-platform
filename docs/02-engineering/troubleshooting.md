# Troubleshooting

This document records common development problems and their fixes for the ERP Platform.

Always verify the actual error message before applying a fix.

---

# Docker

## Error: no configuration file provided

Example:

```text
no configuration file provided: not found
```

Cause:

The Compose file is not in the repository root.

Fix:

```powershell
docker compose -f .\docker\compose.yaml up -d
```

Check status:

```powershell
docker compose -f .\docker\compose.yaml ps
```

---

## Docker services are not running

Check:

```powershell
docker compose -f .\docker\compose.yaml ps
```

View logs:

```powershell
docker compose -f .\docker\compose.yaml logs -f
```

Restart:

```powershell
docker compose -f .\docker\compose.yaml down

docker compose -f .\docker\compose.yaml up -d
```

---

# Ports

## Error: EADDRINUSE on port 3000

Example:

```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

Find the process:

```powershell
Get-NetTCPConnection `
  -LocalPort 3000 `
  -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Inspect it:

```powershell
Get-Process -Id <PID> |
  Select-Object Id, ProcessName, Path
```

Stop it:

```powershell
Stop-Process -Id <PID> -Force
```

Confirm the port is free:

```powershell
Get-NetTCPConnection `
  -LocalPort 3000 `
  -State Listen `
  -ErrorAction SilentlyContinue
```

---

## Two processes are listening on port 3000

Stop both stale processes:

```powershell
Get-NetTCPConnection `
  -LocalPort 3000 `
  -State Listen `
  -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force
  }
```

Then restart only the API:

```powershell
pnpm --filter api start:dev
```

---

# Backend

## NestJS route returns 404

Example:

```text
404 Not Found
```

Check that the API is running on port 3000.

Check route registration in the Nest startup log.

Look for entries such as:

```text
Mapped {/api/v1/auth/login, POST}
```

Verify `app.module.ts` imports the required module.

Verify the controller uses the correct path and version.

Example:

```ts
@Controller({
  path: "auth",
  version: "1",
})
```

Verify `main.ts` contains:

```ts
app.setGlobalPrefix("api");
```

and URI versioning.

Restart the API after changes.

---

## Login route should return 400 for an empty body

Use this route-existence test:

```powershell
try {
  Invoke-RestMethod `
    -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body "{}"
} catch {
  Write-Host "Status:" ([int]$_.Exception.Response.StatusCode)
  $_.ErrorDetails.Message
}
```

Expected:

```text
400
```

A `400` confirms the route exists and validation is working.

A `404` means the route is not registered or the wrong server is running.

---

## TypeScript says an exported class does not exist

Example:

```text
Module has no exported member 'UsersController'
```

Check that the target file exports the expected class:

```ts
export class UsersController {}
```

Also confirm the filename and import path match exactly.

---

## Cannot find module for DTO or service

Example:

```text
Cannot find module './dto/create-user.dto'
```

Verify:

- the file exists;
- the filename matches the import;
- the folder is correct;
- the file exports the expected symbol;
- the import is not pointing to another module by mistake.

Then rebuild:

```powershell
pnpm --filter api build
```

---

## Drizzle query result is missing a required property

Example:

```text
Property 'tokenVersion' is missing
```

Cause:

A typed `select()` object omitted a required database field.

Fix:

Add the field to the selected shape:

```ts
tokenVersion: users.tokenVersion,
```

Or use:

```ts
.select()
```

when the full database row is required.

---

## Refresh token is rejected

Check that:

- the refresh token is the latest rotated token;
- the old token is not reused;
- `JWT_REFRESH_SECRET` matches the value used when signing;
- refresh-token TTL values are valid;
- the stored hash matches the current token;
- the session has not been revoked.

Refresh token rotation means the previous token should stop working after a successful refresh.

---

## Profile returns 401 after refresh

Confirm that the frontend saves the new access token returned by the refresh response.

Do not continue using the expired access token.

Check that the request header contains:

```text
Authorization: Bearer <new-access-token>
```

---

# Frontend

## Login works in PowerShell but not in the browser

This usually means the frontend is using the wrong API URL or port.

Expected ports:

```text
Frontend: http://localhost:3001
API:      http://localhost:3000
```

Check:

```text
apps/web/.env.local
```

It should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Restart Next.js after changing environment variables:

```powershell
pnpm --filter web exec next dev -p 3001
```

In the browser Network panel, the request should be:

```text
POST http://localhost:3000/api/v1/auth/login
```

---

## Frontend reports request failed with status 404

Check that the API helper receives only the route suffix.

Correct:

```ts
apiRequest("/auth/login", {
  method: "POST",
});
```

Incorrect:

```ts
apiRequest("/api/v1/auth/login", {
  method: "POST",
});
```

The base URL already contains `/api/v1`.

---

## Frontend cannot connect to API

The API client should throw a clear network error.

Check:

- API process is running;
- port 3000 is open;
- `NEXT_PUBLIC_API_URL` is correct;
- API and frontend are not using the same port;
- CORS allows the frontend origin.

---

## Next.js says page.tsx is not a module

Example:

```text
File .../page.tsx is not a module
```

Cause:

The page file is empty or has no default export.

Fix:

```tsx
export default function Page() {
  return <div>Page</div>;
}
```

---

## CSS import type error

Example:

```text
Invalid module name in augmentation, module '*.css' cannot be found
```

Do not place this inside `layout.tsx`:

```ts
declare module "*.css";
```

Keep only:

```tsx
import "./globals.css";
```

Then rebuild:

```powershell
pnpm --filter web build
```

---

## Next.js cache or missing chunk error

Example:

```text
ENOENT
vendor-chunks
lucide-react
```

Stop the frontend.

Delete generated caches:

```powershell
Remove-Item `
  .\apps\web\.next `
  -Recurse `
  -Force `
  -ErrorAction SilentlyContinue

Remove-Item `
  .\.turbo `
  -Recurse `
  -Force `
  -ErrorAction SilentlyContinue
```

Rebuild:

```powershell
pnpm --filter web build
```

Restart:

```powershell
pnpm --filter web exec next dev -p 3001
```

If it continues:

```powershell
pnpm install
```

Then rebuild again.

---

## Slow filesystem warning

Example:

```text
Slow filesystem detected
```

This is usually a performance warning rather than a build failure.

Possible improvements:

- keep the repository on a local SSD;
- exclude the project folder from aggressive antivirus scanning;
- avoid network-mounted drives;
- clear `.next` and `.turbo` caches when performance becomes abnormal.

---

# PowerShell

## Read-Host captured the next command

Cause:

A path or command was entered as prompt input instead of being assigned directly.

Safer approach:

```powershell
$sourceSql = "C:\full\path\to\file.sql"
```

Verify:

```powershell
Test-Path $sourceSql
```

Then use it:

```powershell
Copy-Item `
  -Path $sourceSql `
  -Destination ".\docs\legacy-database\file.sql" `
  -Force
```

---

## New-Item reports illegal or positional parameters

Make sure a new command was not accidentally appended to the file path.

Correct:

```powershell
New-Item `
  -ItemType File `
  -Force `
  ".\path\to\file.ts"
```

Then start the next command on a new line after the previous command completes.

---

# Git

## Environment file is staged accidentally

Check:

```powershell
git status --short
```

Unstage:

```powershell
git restore --staged .env
```

or:

```powershell
git restore --staged .\apps\web\.env.local
```

Verify ignore rules:

```powershell
git check-ignore -v .\apps\web\.env.local
```

---

## Undo last commit but keep changes

```powershell
git reset --soft HEAD~1
```

---

## Unstage a file

```powershell
git restore --staged path/to/file
```

---

## Discard changes to one file

```powershell
git restore path/to/file
```

Use carefully.

---

# Build Verification

When debugging is complete, always run:

```powershell
pnpm --filter @erp/db build

pnpm --filter api build

pnpm --filter web build
```

All builds must pass before committing.

---

# Escalation Checklist

Before assuming the problem is complex, verify:

1. Correct terminal directory
2. Docker services running
3. Correct ports
4. Correct environment files
5. Correct API URL
6. Only one API process running
7. Build output is current
8. Generated caches are not stale
9. Imports and filenames match
10. Latest migrations have been applied

Record any new recurring issue in this document after it is resolved.
