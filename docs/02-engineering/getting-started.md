# Getting Started

This guide explains how to set up the ERP Platform for local development.

---

# Requirements

Install the following software before cloning the repository.

## Required

- Git
- Node.js 20+
- pnpm
- Docker Desktop

Verify the installation:

```powershell
git --version

node --version

pnpm --version

docker --version
```

---

# Clone the Repository

```powershell
git clone <repository-url>

cd erp-platform
```

---

# Install Dependencies

From the project root:

```powershell
pnpm install
```

---

# Project Structure

```
erp-platform/

apps/
    api/
    web/

packages/
    config/
    db/

docker/

docs/
```

---

# Environment Variables

## Backend

Create:

```
.env
```

Fill in the required variables.

Example:

```env
DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=
```

---

## Frontend

Create:

```
apps/web/.env.local
```

Contents

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Never commit this file.

Verify:

```powershell
git check-ignore apps/web/.env.local
```

---

# Docker

Start Docker Desktop.

Run:

```powershell
docker compose -f docker/compose.yaml up -d
```

Verify:

```powershell
docker compose -f docker/compose.yaml ps
```

Stop:

```powershell
docker compose -f docker/compose.yaml down
```

---

# Database

Build database package

```powershell
pnpm --filter @erp/db build
```

Generate migration

```powershell
pnpm --filter @erp/db generate
```

Apply migration

```powershell
pnpm --filter @erp/db migrate
```

---

# Backend

Start API

```powershell
pnpm --filter api start:dev
```

Runs on

```
http://localhost:3000
```

API Base

```
http://localhost:3000/api/v1
```

Swagger

```
http://localhost:3000/docs
```

---

# Frontend

Run:

```powershell
pnpm --filter web exec next dev -p 3001
```

Runs on

```
http://localhost:3001
```

Pages

```
/login

/dashboard

/users

/settings/organization
```

---

# Development

Use three terminals.

## Terminal 1

Docker

```powershell
docker compose -f docker/compose.yaml up -d
```

---

## Terminal 2

Backend

```powershell
pnpm --filter api start:dev
```

---

## Terminal 3

Frontend

```powershell
pnpm --filter web exec next dev -p 3001
```

---

# Build

Database

```powershell
pnpm --filter @erp/db build
```

Backend

```powershell
pnpm --filter api build
```

Frontend

```powershell
pnpm --filter web build
```

Everything

```powershell
pnpm --filter @erp/db build

pnpm --filter api build

pnpm --filter web build
```

Every build must pass before committing.

---

# Common URLs

Frontend

```
http://localhost:3001
```

Backend

```
http://localhost:3000
```

API

```
http://localhost:3000/api/v1
```

Swagger

```
http://localhost:3000/docs
```

---

# First Login

Organization

```
MYCOMPANY
```

Administrator email

```
admin@mycompany.com
```

Password

Use the password created during initial setup.

---

# Troubleshooting

See:

```
02-engineering/troubleshooting.md
```

---

# Next Reading

After completing setup:

- Development Workflow
- Coding Standards
- Database Design
- Module Map


Generated SQL migrations are stored in:

```text
packages/db/src/migrations