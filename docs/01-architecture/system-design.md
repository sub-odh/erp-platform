# System Design

## Purpose

This document describes how the ERP Platform is structured at runtime and how its major components interact.

The platform is designed as a self-hosted modular monolith with clear business-domain boundaries.

---

# Runtime Architecture

```text
Browser
   |
   v
Next.js Web Application
   |
   v
NestJS REST API
   |
   +-------------------+
   |                   |
   v                   v
PostgreSQL         Platform Services
                       |
                       +-- Authentication
                       +-- Authorization
                       +-- Tenant Context
                       +-- Licensing
                       +-- Audit
                       +-- Notifications
                       +-- Files
                       +-- Search
```

The frontend communicates with the backend through versioned REST endpoints.

The backend is the security and business-rule boundary.

---

# Applications

## apps/api

The API is a NestJS application.

Responsibilities:

- authentication;
- authorization;
- request validation;
- tenant context;
- business logic;
- database access;
- audit logging;
- license enforcement;
- REST API delivery.

The API runs as a single process during the modular-monolith phase.

---

## apps/web

The frontend is a Next.js application.

Responsibilities:

- user interface;
- navigation;
- forms;
- tables;
- dashboards;
- client-side session handling;
- permission-aware rendering;
- license-aware rendering.

The frontend must never be treated as the security boundary.

All authorization and licensing decisions must also be enforced by the API.

---

# Backend Layering

Every business module follows this structure:

```text
Controller
   |
   v
Service
   |
   v
Repository
   |
   v
Database
```

Additional module components:

```text
Facade
DTOs
Events
Guards
Validators
Tests
```

## Controller

The controller handles HTTP concerns.

Responsibilities:

- route definitions;
- request DTOs;
- authentication guards;
- authorization guards;
- license guards;
- status codes;
- response DTOs.

Controllers must not contain business logic or direct database queries.

---

## Service

The service owns business behavior.

Responsibilities:

- business rules;
- orchestration;
- workflow validation;
- transaction boundaries;
- repository coordination;
- event publication;
- audit coordination.

Services must not expose persistence details to controllers.

---

## Repository

The repository owns database access.

Responsibilities:

- Drizzle queries;
- tenant-scoped reads and writes;
- persistence mapping;
- query-specific filtering;
- pagination;
- sorting.

Repositories must not contain business rules.

---

## Facade

The facade is the public API of a module.

Other modules may call the facade, but may not import the module's internal service or repository.

Example:

```text
Sales Module
   |
   v
CustomersFacade
```

The facade should remain thin and delegate to the module service.

---

## Events

Modules may publish internal domain events.

Examples:

```text
customer.created
quotation.approved
purchase_order.received
invoice.issued
payment.recorded
employee.created
```

Events should be used for decoupled side effects such as:

- notifications;
- audit enrichment;
- search indexing;
- reporting;
- background processing.

---

# Module Boundary Rules

A module owns its own:

- tables;
- repositories;
- services;
- controllers;
- DTOs;
- events;
- tests;
- documentation.

A module must not directly access another module's internal repository.

Allowed communication:

1. exported facade;
2. internal event.

Forbidden communication:

```text
SalesService
   |
   v
InventoryRepository
```

Allowed communication:

```text
SalesService
   |
   v
InventoryFacade
```

or:

```text
sales.order.confirmed
   |
   v
Inventory event handler
```

---

# Platform Services

Platform services are shared across all business modules.

## Authentication

Responsibilities:

- login;
- access-token issuance;
- refresh-token rotation;
- logout;
- session revocation;
- password verification;
- token-version validation.

---

## Authorization

Responsibilities:

- role checks;
- permission checks;
- tenant-scoped access;
- route guards;
- action-level authorization.

---

## Tenant Context

Responsibilities:

- extract tenant identity from the authenticated request;
- expose tenant context during request processing;
- set PostgreSQL tenant session context;
- prevent cross-tenant access.

---

## Licensing

Responsibilities:

- validate the local license file;
- cache licensed modules;
- enforce module and sub-module access;
- enforce user limits;
- control expired-license behavior.

---

## Audit

Responsibilities:

- record mutations;
- capture actor, tenant, action, entity, timestamp, and request metadata;
- preserve before-and-after values where appropriate;
- prevent update or deletion of audit records.

---

## Notifications

Responsibilities:

- in-app notifications;
- email delivery;
- webhook dispatch;
- event-driven notifications.

---

## Files

Responsibilities:

- upload metadata;
- MinIO integration;
- pre-signed URLs;
- file ownership;
- file access validation;
- future virus-scan integration.

---

## Search

Responsibilities:

- OpenSearch indexing;
- tenant-isolated search;
- full-text search;
- faceted search;
- event-driven synchronization.

---

# Request Lifecycle

A typical protected request follows this flow:

```text
1. Client sends request with access token
2. API validates JWT
3. Tenant context is extracted
4. License guard checks entitlement
5. Authorization guard checks role or permission
6. DTO validation runs
7. Controller calls service
8. Service applies business rules
9. Repository runs tenant-scoped query
10. Audit record is written for mutations
11. Domain event is emitted when required
12. Response DTO is returned
```

---

# Authentication Flow

## Login

```text
User submits credentials
   |
   v
API finds tenant and user
   |
   v
Password is verified
   |
   v
Access token is issued
   |
   v
Refresh session is created
   |
   v
Login response is returned
```

## Refresh

```text
Client submits refresh token
   |
   v
Token signature is verified
   |
   v
Session hash is validated
   |
   v
Old refresh token is rotated
   |
   v
New access and refresh tokens are issued
```

## Logout

```text
Client submits refresh token
   |
   v
Session is located
   |
   v
Session is revoked
```

---

# Tenant Isolation

Every tenant-owned table includes:

```text
tenant_id
```

Tenant isolation is enforced at two layers:

1. application-level query scoping;
2. PostgreSQL Row-Level Security.

The API sets tenant context inside database transactions:

```sql
set local app.local_tenant_id = '<tenant-uuid>';
```

The database then restricts rows using RLS policies.

Application-level filtering alone is not sufficient.

---

# Database Ownership

Tables are prefixed by their owning module.

Examples:

```text
platform_users
platform_audit_logs

sales_customers
sales_quotations

ops_products
ops_inventory_movements

finance_invoices
finance_payments

hr_employees
hr_leave_requests
```

This makes module ownership visible during development and code review.

---

# API Design

The API uses versioned REST endpoints.

Example base path:

```text
/api/v1
```

Example routes:

```text
POST   /api/v1/auth/login
GET    /api/v1/users
POST   /api/v1/sales/customers
GET    /api/v1/ops/products
POST   /api/v1/finance/invoices
```

API rules:

- request and response DTOs are separate;
- validation is mandatory;
- internal database rows are not returned directly;
- structured errors are used;
- authorization is enforced server-side;
- module licensing is enforced server-side.

---

# Frontend Structure

The frontend mirrors backend business domains.

Example:

```text
app/
components/
hooks/
lib/
types/
```

Module-specific frontend code should be grouped consistently.

Example:

```text
customers/
├── components/
├── hooks/
├── forms/
├── api/
├── types/
└── page.tsx
```

Pages should remain thin.

Server data should eventually be managed using TanStack Query.

Client state should eventually be managed using Zustand.

Forms should eventually use React Hook Form and Zod.

---

# Deployment Topology

The target production topology is:

```text
Internet / LAN
      |
      v
Nginx
      |
      +------ serves frontend
      |
      +------ proxies /api to NestJS
                         |
                         v
                    PgBouncer
                         |
                         v
                    PostgreSQL
```

Additional platform services:

```text
Redis
MinIO
NATS
OpenSearch
```

These services remain internal to the Docker network.

---

# Development Topology

During local development:

```text
Frontend: http://localhost:3001
API:      http://localhost:3000
```

Docker provides supporting infrastructure.

The frontend and API are started separately for fast development feedback.

---

# Failure Handling

The platform should use structured failure behavior.

Examples:

- validation failure → `400`;
- unauthenticated request → `401`;
- unauthorized action → `403`;
- missing record → `404`;
- duplicate record → `409`;
- unlicensed module → `403` with structured module error;
- unexpected server failure → `500`.

Internal error details must not expose secrets or stack traces in production responses.

---

# Scalability Strategy

The initial system is a modular monolith.

Scaling options include:

- multiple API instances behind Nginx;
- PgBouncer for database connection pooling;
- Redis for shared session and cache state;
- NATS for asynchronous processing;
- OpenSearch for search workloads;
- MinIO for file storage.

A module may later be extracted into a service only when operational needs justify it.

---

# Guiding Principle

The system should remain simple to deploy while preserving strict internal boundaries.

The goal is not to imitate microservices inside one process.

The goal is to maintain clear ownership, predictable dependencies, and safe future evolution.
