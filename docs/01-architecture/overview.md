# Architecture Overview

## Purpose

The ERP Platform is designed as a modern, modular, multi-tenant ERP system.

The architecture prioritizes:

- Maintainability
- Scalability
- Security
- Performance
- Clear module ownership
- Future service extraction

The system begins as a **modular monolith**, allowing rapid development while preserving clean boundaries between domains.

---

# High-Level Architecture

```
                        ERP Platform

                    Platform Services
──────────────────────────────────────────────────

 Authentication
 Authorization
 Licensing
 Audit
 Notifications
 File Storage
 Search

──────────────────────────────────────────────────

 Administration

 Organizations
 Users
 Roles
 Permissions
 Settings

──────────────────────────────────────────────────

 CRM

 Customers
 Contacts
 Leads
 Deals
 Activities
 Quotations
 Tenders

──────────────────────────────────────────────────

 Operations

 Products
 Categories
 Units
 Vendors
 Purchasing
 Inventory
 Delivery Orders

(Warehouses deferred)

──────────────────────────────────────────────────

 Finance

 Invoices
 Payments
 Expenses
 Accounts
 General Ledger

──────────────────────────────────────────────────

 Human Resources

 Employees
 Attendance
 Leave
 Payroll
 Documents

──────────────────────────────────────────────────

 Executive Dashboard

 KPIs
 Reports
 Analytics
```

---

# Architectural Principles

The platform follows these principles:

## Modular Monolith

Business modules are independent.

Each module owns:

- Database tables
- Services
- Controllers
- DTOs
- Validation
- Business rules
- Tests

Modules communicate through exported facades or internal events.

Direct repository access across modules is not allowed.

---

## Multi-Tenant

Every business record belongs to a tenant.

Tenant isolation is enforced using PostgreSQL Row-Level Security (RLS).

All tenant-owned tables include:

- tenant_id
- created_at
- updated_at

---

## Shared Platform

Cross-cutting concerns belong to Platform Services.

Examples:

- Authentication
- Authorization
- Audit Logging
- Notifications
- File Storage
- Licensing

Business modules should not implement these independently.

---

## Backend

Technology:

- NestJS
- TypeScript
- Drizzle ORM
- PostgreSQL

Responsibilities:

- Business rules
- Validation
- Authorization
- Database access
- API

---

## Frontend

Technology:

- Next.js
- React
- Tailwind CSS

Responsibilities:

- User interface
- Forms
- Tables
- Dashboards
- Navigation

Business rules remain in the backend.

---

## Database

PostgreSQL is the system of record.

Design principles:

- UUID primary keys
- Tenant isolation
- Foreign keys
- Normalization
- Audit fields
- Numeric money types
- Shared conventions

Legacy MySQL data is **not migrated**.

The previous database is used only as a business reference.

---

## Future Evolution

The architecture allows future extraction into services if required.

Potential future services:

- Authentication
- Notifications
- Search
- Reporting

The initial implementation remains a modular monolith for simplicity and maintainability.

---

## Guiding Principle

Every architectural decision should make the ERP easier to understand, easier to extend, and safer to maintain.

Consistency is preferred over unnecessary complexity.
