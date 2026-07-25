# ERP Platform Engineering Handbook

**Project:** ERP Platform  
**Version:** 2.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This handbook defines the engineering standards, architectural principles,
development workflow, and coding conventions for the ERP Platform.

Every application, package, module, service, and contributor must follow
these standards.

The objective is to build a maintainable, scalable, secure, and
enterprise-grade ERP platform.

---

# Vision

Build a modular ERP platform capable of supporting multiple business domains
while maintaining a clean architecture, high code quality, and long-term
maintainability.

---

# Engineering Principles

## 1. Readability over cleverness

Write code that is easy to understand.

Future developers should immediately understand what the code is doing.

---

## 2. Consistency over personal preference

Consistency across the repository is more important than individual coding
styles.

---

## 3. Simplicity over premature optimization

Optimize only after measuring.

Avoid unnecessary complexity.

---

## 4. Composition over inheritance

Prefer small reusable components and services.

---

## 5. Explicit over implicit

Code should clearly express intent.

Avoid hidden behavior.

---

## 6. Architecture first

Every major technical decision must be documented through an ADR.

---

## 7. Testable by design

Code should be written with testing in mind.

---

## 8. Security by default

Security is part of development—not an afterthought.

---

## 9. Build for maintainability

Assume this project will be maintained for many years.

---

# Technology Stack

## Backend

- NestJS 11
- Express
- TypeScript

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Database

- PostgreSQL
- Drizzle ORM

## State Management

- TanStack Query
- Zustand

## Validation

- Zod
- React Hook Form

## Monorepo

- pnpm
- Turborepo

## Testing

- Jest
- Playwright

---

# Architecture Principles

The ERP follows these architectural principles.

- Modular Monolith
- Domain Driven Modules
- Feature Based Organization
- API First Design
- Shared Packages
- Monorepo Architecture
- Event Ready Design
- Dependency Injection
- Separation of Concerns

---

# Repository Structure

```
erp-platform/

apps/
├── api
└── web

packages/
├── configs
│   ├── eslint
│   ├── prettier
│   └── typescript
│
├── db
├── licensing
├── types
└── ui

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

## api

Responsible for

- Business Logic
- Authentication
- Authorization
- REST APIs
- Database Access
- Events
- Background Jobs

---

## web

Responsible for

- User Interface
- Routing
- Forms
- Dashboard
- Client State
- Server Components

---

# Packages

Reusable code belongs inside

```
packages/
```

Applications may depend on packages.

Packages must NEVER depend on applications.

---

## configs

Shared configuration.

Contains

- ESLint
- Prettier
- TypeScript

---

## db

Responsible for

- Drizzle ORM
- Database Schema
- Migrations
- Database Utilities

---

## ui

Reusable UI components.

---

## licensing

Licensing system.

---

## types

Shared TypeScript types.

---

# Dependency Direction

Allowed

```
Application

↓

Package
```

Forbidden

```
Package

↓

Application
```

---

# Backend Architecture

Every request flows through

```
Request

↓

Controller

↓

Service

↓

Repository

↓

Database
```

---

# Layer Responsibilities

## Controller

Responsible for

- HTTP
- Validation
- Request Mapping
- Response Mapping

Controllers must NEVER

- Contain business logic
- Access the database
- Execute SQL

---

## Service

Responsible for

- Business Rules
- Orchestration
- Transactions
- Validation

Services should remain framework independent whenever practical.

---

## Repository

Responsible for

- Database Queries
- Persistence
- Retrieval

Repositories contain NO business logic.

---

# Module Standards

Every business module owns

- Controller
- Service
- Repository
- DTOs
- Types
- Tests
- Documentation

Modules communicate through

- Services
- Events
- Facades

Never by directly accessing another module's repository.

---

# Folder Naming

Folders use

```
kebab-case
```

Example

```
employee-management
```

---

# File Naming

Files use

```
kebab-case
```

Examples

```
employee.service.ts

employee.controller.ts

employee.repository.ts
```

---

# Class Naming

Classes use

```
PascalCase
```

Example

```
EmployeeService
```

---

# Variables

Use

```
camelCase
```

Example

```
employeeCount
```

---

# Constants

Use

```
UPPER_SNAKE_CASE
```

Example

```
DEFAULT_PAGE_SIZE
```

---

# General Rules

Never place business logic inside

- Controllers
- Middleware
- Guards
- Repositories

Business rules belong inside Services.

---

Never access another module's repository directly.

---

Never duplicate business logic.

---

Always prefer composition.

---

Keep functions small.

---

Avoid deeply nested code.

---

# API Standards

REST naming conventions

```
GET

POST

PUT

PATCH

DELETE
```

Plural resources

```
/users

/orders

/products
```

Never expose database models directly.

Always use DTOs.

---

# Database Standards

Use

- PostgreSQL
- Drizzle ORM

Rules

- Never execute raw SQL inside controllers.
- Keep migrations under version control.
- Use transactions when modifying multiple tables.
- Avoid N+1 queries.

---

# Security Standards

Always

- Validate input
- Sanitize data
- Hash passwords
- Store secrets in environment variables
- Follow least privilege

Never

- Commit secrets
- Store passwords
- Log sensitive information

---

# Logging

Use structured logging.

Never log

- Passwords
- Tokens
- Secrets

---

# Error Handling

Always throw meaningful exceptions.

Never expose internal implementation details to clients.

---

# Testing Strategy

Every feature should include tests.

## Unit Tests

Business logic.

---

## Integration Tests

API endpoints.

---

## End-to-End Tests

Critical business workflows.

---

# Documentation Standards

Every module must include

- README
- API documentation
- Architecture notes
- Tests

Every significant architectural decision must be documented as an ADR.

---

# Git Workflow

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

Release branches

```
release/<version>
```

---

# Commit Convention

Use Conventional Commits.

Allowed prefixes

```
init
build
feat
fix
docs
refactor
test
infra
security
release
```

Examples

```
init: initialize monorepo

build(api): bootstrap NestJS application

feat(auth): implement login

fix(users): validate email

docs: update engineering handbook

refactor(rbac): simplify permission resolver
```

---

# Pull Requests

Every pull request should answer

- Why?
- What changed?
- How was it tested?
- Are there breaking changes?
- Has documentation been updated?

---

# Development Workflow

Every task follows the same workflow.

```
Plan

↓

Design

↓

Implement

↓

Review

↓

Test

↓

Document

↓

Commit

↓

Push
```

---

# Code Review Checklist

Before merging verify

- Code follows architecture
- Naming is consistent
- No duplicated logic
- Tests pass
- Documentation updated
- No unnecessary dependencies
- No security issues
- No dead code

---

# Future Standards

The following standards will be expanded as the project grows.

- Authentication
- Authorization
- RBAC
- Multi-tenancy
- Event Architecture
- Caching
- Queue Processing
- Background Jobs
- Notifications
- Reporting
- Performance
- Monitoring
- CI/CD
- Deployment
- Disaster Recovery

---

# Final Rule

Leave the codebase better than you found it.

Every commit should improve the quality of the project.
