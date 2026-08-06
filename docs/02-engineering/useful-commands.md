# Useful Commands

This document contains the most frequently used commands for developing the ERP Platform.

Always run commands from the project root unless otherwise stated.

---

# Repository

Current branch

```powershell
git branch --show-current
```

Repository status

```powershell
git status
```

Review changes

```powershell
git diff
```

Review staged changes

```powershell
git diff --cached
```

Stage everything

```powershell
git add -A
```

Commit

```powershell
git commit -m "feat: description"
```

Push

```powershell
$branch = git branch --show-current

git push origin $branch
```

Pull latest changes

```powershell
git pull
```

---

# Dependencies

Install all packages

```powershell
pnpm install
```

Update lockfile

```powershell
pnpm install
```

List workspace packages

```powershell
pnpm list -r
```

---

# Docker

Start containers

```powershell
docker compose -f docker/compose.yaml up -d
```

Stop containers

```powershell
docker compose -f docker/compose.yaml down
```

Restart

```powershell
docker compose -f docker/compose.yaml restart
```

View running containers

```powershell
docker compose -f docker/compose.yaml ps
```

View logs

```powershell
docker compose -f docker/compose.yaml logs -f
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

Run migration

```powershell
pnpm --filter @erp/db migrate
```

---

# Backend

Run development server

```powershell
pnpm --filter api start:dev
```

Build

```powershell
pnpm --filter api build
```

Lint

```powershell
pnpm --filter api lint
```

---

# Frontend

Development server

```powershell
pnpm --filter web exec next dev -p 3001
```

Build

```powershell
pnpm --filter web build
```

Lint

```powershell
pnpm --filter web lint
```

---

# Entire Project

Install

```powershell
pnpm install
```

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

---

# Environment

Backend environment

```
.env
```

Frontend environment

```
apps/web/.env.local
```

Verify frontend environment is ignored

```powershell
git check-ignore apps/web/.env.local
```

---

# Build Verification

Run before every commit

```powershell
pnpm --filter @erp/db build

pnpm --filter api build

pnpm --filter web build
```

---

# API Testing

Health check

```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/v1/auth/status"
```

Login

```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json"
```

---

# Running Services

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

Frontend

```
http://localhost:3001
```

---

# Ports

Check listeners

```powershell
Get-NetTCPConnection `
    -LocalPort 3000,3001 `
    -State Listen
```

Identify process

```powershell
Get-Process -Id <PID>
```

Kill process

```powershell
Stop-Process -Id <PID> -Force
```

---

# Next.js Cache

Delete cache

```powershell
Remove-Item `
    .\apps\web\.next `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue
```

Delete Turbo cache

```powershell
Remove-Item `
    .\.turbo `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue
```

---

# Documentation

Documentation index

```
docs/README.md
```

Architecture

```
docs/01-architecture
```

Engineering

```
docs/02-engineering
```

Database

```
docs/04-database
```

API

```
docs/05-api
```

Modules

```
docs/06-modules
```

---

# Development Checklist

Every feature should follow this sequence.

```
Plan

↓

Database

↓

Migration

↓

Backend

↓

Frontend

↓

Testing

↓

Documentation

↓

Build

↓

Commit

↓

Push
```

---

# Before Every Push

```powershell
git status

git diff

git add -A

git diff --cached

pnpm --filter @erp/db build

pnpm --filter api build

pnpm --filter web build
```

If successful

```powershell
git commit -m "..."

$branch = git branch --show-current

git push origin $branch
```

```powershell
docker compose `
  --env-file .\.env `
  -f .\docker\compose.yaml `
  up -d
```
