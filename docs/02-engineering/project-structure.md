# Project Structure

This document explains the structure of the ERP Platform repository.

Every directory has a defined responsibility.

Following these conventions keeps the codebase organized and scalable.

---

# Repository Overview

```
erp-platform/

apps/
packages/
docker/
docs/

package.json
pnpm-workspace.yaml
turbo.json
README.md
```

---

# Root Directory

The root contains only project-wide configuration.

Typical files:

```
README.md

package.json

pnpm-workspace.yaml

turbo.json

.env.example
```

The root should **not** contain application code.

---

# apps/

Contains runnable applications.

```
apps/

api/

web/
```

---

# apps/api

NestJS Backend.

Responsibilities

- REST API
- Authentication
- Authorization
- Business Logic
- Validation
- Database Access
- Audit
- Events

Example

```
apps/api/src/

modules/

common/

config/

main.ts

app.module.ts
```

---

# apps/api/src/modules

Every business module lives here.

Example

```
modules/

auth/

users/

customers/

inventory/

finance/

hr/
```

Every module owns:

```
module/

controller

service

repository

facade

dto/

entities/

events/

guards/

validators/

tests/
```

---

# apps/api/src/common

Contains reusable backend code.

Examples

```
decorators/

filters/

guards/

interceptors/

pipes/

utils/

constants/
```

Business logic should never be placed here.

---

# apps/web

Next.js frontend.

Contains:

```
app/

components/

hooks/

lib/

types/

styles/

public/
```

---

# app/

Contains App Router pages.

Example

```
app/

login/

dashboard/

users/

customers/

settings/
```

Pages should remain small.

---

# components/

Reusable UI.

```
components/

ui/

layout/

tables/

forms/

navigation/

feedback/
```

Examples

```
Button

Input

Modal

DataTable

SearchToolbar

PageHeader

Sidebar

Navbar
```

---

# hooks/

Reusable React hooks.

Examples

```
useAuth()

useUsers()

useCustomers()

usePagination()
```

---

# lib/

Reusable utilities.

Examples

```
api.ts

auth.ts

users.ts

customers.ts

validators.ts
```

---

# types/

Shared TypeScript types.

Examples

```
user.ts

customer.ts

invoice.ts

auth.ts
```

---

# packages/

Contains shared packages.

```
packages/

config/

db/
```

---

# packages/config

Shared configuration.

Examples

```
Environment

Constants

Feature Flags
```

---

# packages/db

Database package.

Contains

```
Drizzle Schemas

Database Client

Migrations

Seeds
```

No business logic belongs here.

---

# docker/

Infrastructure.

Contains

```
compose.yaml

postgres/

nginx/

redis/
```

Future additions

```
MinIO

PgBouncer

Monitoring
```

---

# docs/

Project documentation.

Contains

```
Architecture

Engineering

Database

Deployment

Security

Roadmap
```

Documentation evolves together with the project.

---

# Module Ownership

Every business concept belongs to exactly one module.

Example

Customers

```
customers module
```

Invoices

```
finance module
```

Products

```
operations module
```

Users

```
platform/admin module
```

Avoid duplicate ownership.

---

# Import Rules

Allowed

```
Controller

↓

Service

↓

Repository
```

Forbidden

```
Controller

↓

Database
```

Forbidden

```
Customer Repository

↓

Inventory Repository
```

Cross-module communication should occur through:

- exported facades
- internal events

---

# File Naming

Use consistent names.

Examples

```
customers.service.ts

customers.controller.ts

customers.repository.ts

customers.module.ts
```

DTOs

```
create-customer.dto.ts

update-customer.dto.ts
```

Types

```
customer.ts

invoice.ts

user.ts
```

React Components

```
CustomerTable.tsx

CreateCustomerModal.tsx

SearchToolbar.tsx
```

Hooks

```
useCustomers.ts

useInventory.ts
```

---

# Future Modules

The repository is expected to grow to include:

```
CRM

Inventory

Purchasing

Sales

Finance

HR

Dashboard

Reports

Notifications

Licensing

Audit

Files
```

The directory structure should support growth without major reorganization.

---

# Guiding Principle

When adding new code, first ask:

- Which module owns this?
- Is there already a reusable component?
- Does this belong in a shared package?
- Can this be documented alongside the implementation?

If the answer is unclear, revisit the architecture documents before adding new files.
