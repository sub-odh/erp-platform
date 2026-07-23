# Engineering Handbook

**Project:** ERP Platform

**Version:** 1.0

**Status:** Draft

---

# Purpose

This handbook defines the engineering standards for the ERP Platform.

Every application, package, module and service must follow these standards.

---

# Core Principles

1. Readability over cleverness.
2. Consistency over personal preference.
3. Simplicity over premature optimization.
4. Composition over inheritance.
5. Explicit is better than implicit.
6. Every architectural decision must be documented.
7. Every feature must include tests.
8. Security is never optional.

---

# Repository Structure

```
apps/
packages/
docs/
docker/
scripts/
```

---

# Applications

Applications live inside:

```
apps/
```

Example

```
api
web
```

---

# Packages

Reusable code lives inside:

```
packages/
```

Packages must never depend on applications.

Applications may depend on packages.

---

# Module Rules

Each business module owns:

- Controllers
- Services
- Repositories
- DTOs
- Events
- Tests

Modules must never access another module's repository directly.

Communication happens through:

- Facades
- Events

---

# Dependency Direction

Allowed

Application

↓

Package

Forbidden

Package

↓

Application

---

# Naming Conventions

Classes

PascalCase

```
EmployeeService
```

Interfaces

Prefix with I only when necessary.

```
EmployeeRepository
```

Variables

camelCase

```
employeeCount
```

Constants

UPPER_SNAKE_CASE

```
DEFAULT_PAGE_SIZE
```

Files

kebab-case

```
employee.service.ts
```

Folders

kebab-case

```
employee-management
```

---

# General Rules

No business logic inside controllers.

No raw SQL inside controllers.

No business logic inside repositories.

Services contain business rules.

Repositories contain persistence.

Controllers handle HTTP.

---

# Documentation

Every module must contain:

- README
- API documentation
- Architecture notes
- Tests

---

# Git

Main branch

```
main
```

Feature branches

```
feature/<name>
```

Bug fixes

```
fix/<name>
```

---

# Commits

Follow Conventional Commits.

Examples

```
feat(auth): add refresh token

fix(user): validate email

refactor(rbac): simplify permission resolver

docs: update handbook
```

---

# Code Reviews

Every pull request should answer:

- Why?
- What changed?
- How was it tested?
- Any breaking changes?

---

# Future Sections

- API Standards
- DTO Standards
- Validation
- Error Handling
- Logging
- Testing
- Security
- Events
- Database Standards
- Performance
