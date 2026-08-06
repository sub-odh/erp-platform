# Coding Guidelines

This document defines the coding standards for the ERP Platform.

Every developer should follow these guidelines to ensure consistency, maintainability, and scalability.

---

# General Principles

Always prefer:

- Readability over cleverness.
- Explicit code over implicit behavior.
- Composition over duplication.
- Strong typing.
- Small, focused functions.
- Small, focused classes.
- Clear naming.
- Consistent formatting.

Avoid:

- Duplicate business logic.
- Long methods.
- Large files.
- Hidden side effects.
- Magic numbers.
- Magic strings.

---

# TypeScript

Always enable strict typing.

Never use:

```ts
any;
```

Instead use:

```ts
unknown;
```

or proper interfaces.

Always prefer:

```ts
interface;
```

for object contracts.

Use:

```ts
type;
```

for unions and utility types.

---

# Naming

## Variables

Good

```ts
customer;

invoice;

organizationId;

createdAt;
```

Bad

```ts
c;

obj;

temp;

data1;
```

---

## Functions

Function names should describe behavior.

Good

```ts
createCustomer();

updateInventory();

calculateBalance();

findUserByEmail();
```

Bad

```ts
doStuff();

process();

run();

execute();
```

---

## Booleans

Always start with:

```
is

has

can

should
```

Examples

```ts
isActive;

hasPermission;

canEdit;

shouldRefresh;
```

---

# File Naming

Backend

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

Frontend Components

```
CustomerTable.tsx

CreateCustomerModal.tsx

PageHeader.tsx
```

Hooks

```
useCustomers.ts

useAuth.ts
```

Types

```
customer.ts

invoice.ts

user.ts
```

---

# Controllers

Controllers should only:

- Receive requests.
- Validate input.
- Call services.
- Return responses.

Controllers should never:

- Contain business logic.
- Query the database.
- Calculate values.
- Coordinate transactions.

---

# Services

Services contain business rules.

Services may:

- Validate workflows.
- Coordinate repositories.
- Handle transactions.
- Publish events.

Services should not contain raw SQL.

---

# Repositories

Repositories own database access.

Repositories:

- Execute queries.
- Return domain objects.
- Do not contain business rules.

---

# DTOs

DTOs define request and response contracts.

Always validate DTOs.

Example

```ts
export class CreateCustomerDto {}
```

Never expose database entities directly to external APIs.

---

# Error Handling

Throw meaningful exceptions.

Examples

```ts
NotFoundException;

ConflictException;

ForbiddenException;

UnauthorizedException;

BadRequestException;
```

Avoid generic:

```ts
throw new Error(...)
```

when a framework exception is available.

---

# Logging

Use structured logging.

Never log:

- Passwords
- Access tokens
- Refresh tokens
- Secrets

Log:

- IDs
- Actions
- Execution time
- Errors

---

# Database

Use repositories.

Never access the database directly from:

- Controllers
- Guards
- Interceptors

---

# Frontend

Pages should remain small.

Move reusable UI into:

```
components/
```

Move reusable logic into:

```
hooks/
```

Move API calls into:

```
lib/
```

---

# React Components

Prefer:

Small components.

Reusable components.

Single responsibility.

Avoid:

500-line components.

---

# Styling

Use Tailwind CSS.

Avoid inline styles unless necessary.

Prefer reusable utility classes.

---

# Forms

Forms should include:

- Validation
- Loading state
- Error state
- Success feedback
- Disabled state while submitting

---

# Tables

Every table should support:

- Empty state
- Loading state
- Error state
- Search
- Pagination (when applicable)
- Sorting (when applicable)

---

# API

Always call backend through shared API helpers.

Do not call fetch() directly throughout the application.

---

# Documentation

Every public function should have a clear name.

Complex business rules should include explanatory comments.

Keep documentation synchronized with implementation.

---

# Testing

New features should include:

- Backend verification.
- Frontend verification.
- Manual validation.
- Documentation updates.

---

# Code Review Checklist

Before committing, verify:

- Names are meaningful.
- No duplicated logic.
- Strong typing.
- No unused imports.
- No debug code.
- No console logs left unintentionally.
- Documentation updated.
- Builds pass.

---

# Guiding Principle

Write code that another developer can understand six months later without needing additional explanation.

Consistency is more valuable than cleverness.
