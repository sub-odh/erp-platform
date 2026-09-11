# Docker

The platform ships one multi-stage `Dockerfile` at the repository root. The
build context must be the repository root, because the API and the web app both
depend on the shared workspace packages.

---

## Build Targets

| Target    | Contains                  | Entry point                       |
| --------- | ------------------------- | --------------------------------- |
| `api`     | NestJS server             | `node dist/main`                  |
| `web`     | Next.js standalone server | `node apps/web/server.js`         |
| `migrate` | Drizzle migrator          | `drizzle-kit migrate`, then exits |

Build a single image:

```powershell
docker build --target api -t erp-api .
docker build --target web -t erp-web .
```

---

## Running The Full Stack

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

This starts PostgreSQL, applies pending migrations, then starts the API on
`http://localhost:3000/api/v1` and the web app on `http://localhost:3001`.

The `migrate` service runs on every `up`, applies whatever is outstanding, and
exits. The API waits for it to finish successfully before starting.

Two named volumes hold state:

- `postgres-data` — database files;
- `api-uploads` — uploaded avatars, logos and guarantee documents, mounted at
  `/app/uploads`. Files are served only through the authenticated media route.

Stop the stack, keeping data:

```powershell
docker compose down
```

Stop and delete the data:

```powershell
docker compose down -v
```

---

## Database Only

`docker/compose.yaml` is a separate, smaller stack that runs PostgreSQL and
pgAdmin for host-based development, where the apps themselves run under pnpm.
Use it instead of the root compose file when developing:

```powershell
cd docker
docker compose up -d
```

The root stack does not publish a PostgreSQL host port, so both can run at the
same time without clashing on `5432`.

---

## The API URL Is A Build Argument

Next.js inlines `NEXT_PUBLIC_*` values into the client bundle at build time, so
the API URL cannot be changed by restarting the container. It is passed as a
build argument and defaults to `http://localhost:3000/api/v1`:

```powershell
docker build --target web --build-arg NEXT_PUBLIC_API_URL=https://erp.example.com/api/v1 -t erp-web .
```

Through compose, set `NEXT_PUBLIC_API_URL` in `.env` and rebuild:

```powershell
docker compose up -d --build web
```

The value must be the URL the **browser** uses, not an internal service name.

---

## Production Checklist

The API compose service hardcodes `NODE_ENV: production`, so it will not
inherit `NODE_ENV=development` from the host `.env`. It refuses to start
without a signed licence.

Mount both files read-only by uncommenting the licence volumes in
`docker-compose.yml`:

```yaml
- ./license.json:/app/license.json:ro
- ./license-public.pem:/app/license-public.pem:ro
```

Host-based `pnpm` development still uses `NODE_ENV=development` in `.env`,
which is the only mode that loads the unrestricted local licence.

To run the compose stack without licence files (local evaluation only), override
the API service:

```yaml
services:
  api:
    environment:
      NODE_ENV: development
```

**Secrets.** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must each be at least
32 characters, and `SMTP_CREDENTIAL_ENCRYPTION_KEY` must be changed from the
development default. The API validates all three at boot and exits on failure.

**CORS.** `CORS_ORIGIN` must match the public web origin, since the refresh
token is delivered as a credentialed cookie.

**Owner account.** A fresh database has no users. Create the first owner with
the script in `apps/api/src/scripts/create-owner.ts`.

**Uploads.** Back up the `api-uploads` volume alongside the database. Uploaded
files are not stored in PostgreSQL.

---

## Notes

- Images are based on `node:22-bookworm-slim`. Debian rather than Alpine,
  because `bcrypt` needs a glibc toolchain to build when no prebuilt binary
  matches.
- The web build sets `NEXT_OUTPUT_STANDALONE=true`, which switches on
  `output: "standalone"` in `next.config.ts`. It is opt-in because emitting the
  standalone bundle needs symlink privileges that Windows withholds by default,
  which would otherwise break local builds.
- The API image is produced with `pnpm deploy`, which flattens the workspace
  links into a standalone tree, so the runtime image contains no pnpm store and
  no development dependencies.
- The `migrate` target is built from the API build stage rather than the pruned
  runtime tree, because `drizzle-kit` is a development dependency.
- Both application containers run as the unprivileged `node` user.
