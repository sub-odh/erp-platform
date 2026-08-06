# Git Workflow

This document defines the Git workflow used throughout the ERP Platform.

Following a consistent Git workflow keeps the repository clean, traceable, and easy to collaborate on.

---

# Workflow Overview

Every change should follow this sequence.

```
Code
    ↓
Build
    ↓
Test
    ↓
Review
    ↓
Stage
    ↓
Commit
    ↓
Push
```

Never skip the build or review steps.

---

# Daily Workflow

## 1. Check Repository Status

Always begin by checking the current state of the repository.

```powershell
git status
```

---

## 2. Review Changes

Before staging, inspect all modifications.

```powershell
git diff
```

Never stage code you have not reviewed.

---

## 3. Stage Changes

Stage everything:

```powershell
git add -A
```

Or stage individual files:

```powershell
git add path/to/file
```

---

## 4. Review Staged Files

Verify which files are staged.

```powershell
git diff --cached --name-only
```

---

## 5. Review Staged Changes

Always inspect the staged changes.

```powershell
git diff --cached
```

This prevents accidental commits.

---

## 6. Build Before Commit

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

Every build must succeed.

---

## 7. Commit

Commit only after:

- Successful builds
- Documentation updates
- Reviewing staged changes

Example:

```powershell
git commit -m "feat: add customer management"
```

---

## 8. Push

Find the current branch:

```powershell
git branch --show-current
```

Push:

```powershell
$branch = git branch --show-current

git push origin $branch
```

---

# Commit Message Standard

Use Conventional Commits.

## Feature

```
feat: add customer module
```

## Fix

```
fix: correct JWT validation
```

## Refactor

```
refactor: extract customer repository
```

## Documentation

```
docs: update getting started guide
```

## Test

```
test: add authentication tests
```

## Chore

```
chore: update dependencies
```

---

# Branch Strategy

Main branches

```
main
develop
```

Feature branches

```
feature/customers

feature/products

feature/inventory
```

Bug fixes

```
fix/login

fix/token-refresh
```

Documentation

```
docs/database-design
```

---

# Files That Must Never Be Committed

Never commit:

```
.env

.env.local

node_modules/

.next/

dist/

coverage/

*.log

database backups

private keys

access tokens

refresh tokens

license files containing secrets
```

---

# Before Every Push

Run:

```powershell
git status

git diff

git add -A

git diff --cached

pnpm --filter @erp/db build

pnpm --filter api build

pnpm --filter web build
```

If everything succeeds:

```powershell
git commit -m "..."

git push
```

---

# Recovering Mistakes

## Unstage a File

```powershell
git restore --staged path/to/file
```

---

## Discard Local Changes

```powershell
git restore path/to/file
```

---

## Restore Everything

```powershell
git restore .
```

---

## Undo Last Commit (Keep Changes)

```powershell
git reset --soft HEAD~1
```

---

## Undo Last Commit Completely

```powershell
git reset --hard HEAD~1
```

Use with caution.

---

# Good Practices

Always:

- Build before commit.
- Review staged changes.
- Write meaningful commit messages.
- Keep commits focused.
- Update documentation with code changes.

Avoid:

- Large commits.
- Mixing unrelated changes.
- Committing generated files.
- Committing secrets.
- Force-pushing shared branches.

---

# Release Checklist

Before creating a release:

- All builds pass.
- Documentation updated.
- Database migrations committed.
- No TODOs in released code.
- No debug logging.
- No secrets in Git.
- Repository is clean.

Verify:

```powershell
git status
```

Expected:

```
nothing to commit, working tree clean
```