# Module Map

## Purpose

This document defines every module in the ERP Platform, its ownership, responsibilities, dependencies, and boundaries.

A module is the smallest independently owned business domain.

Each module owns its own:

- Database tables
- Business rules
- Services
- Repositories
- Controllers
- DTOs
- Validation
- Tests
- Documentation

Modules communicate only through exported facades or domain events.

---

# ERP Module Overview

```text
Platform
│
├── Authentication
├── Authorization
├── Tenant Context
├── Licensing
├── Audit
├── Notifications
├── Files
└── Search

Administration
│
├── Organizations
├── Users
├── Roles
├── Permissions
└── Settings

Sales / CRM
│
├── Customers
├── Contacts
├── Leads
├── Deals
├── Activities
├── Quotations
└── Tenders

Operations
│
├── Categories
├── Units
├── Products
├── Vendors
├── Purchasing
├── Inventory
└── Delivery Orders

Finance
│
├── Accounts
├── Invoices
├── Payments
├── Expenses
└── General Ledger

HR
│
├── Employees
├── Attendance
├── Leave
├── Payroll
└── Documents

Executive
│
├── Dashboard
├── Reports
└── Analytics
```

---

# Platform Module

Purpose:

Provide shared services used by every business module.

Responsibilities:

- Authentication
- Authorization
- Licensing
- Audit
- Notifications
- File Management
- Search
- Tenant Context

Owns:

```
platform_users

platform_roles

platform_permissions

platform_auth_sessions

platform_license_state

platform_notifications

platform_audit_logs

platform_files
```

Dependencies:

None.

Everything else depends on Platform.

---

# Administration Module

Purpose:

Manage organization configuration.

Responsibilities:

- Organizations
- Users
- Roles
- Permissions
- Settings

Depends on:

Platform

Exports:

```
UsersFacade

RolesFacade
```

---

# Sales / CRM Module

Purpose:

Manage the customer lifecycle.

Responsibilities:

- Customers
- Contacts
- Leads
- Deals
- Activities
- Quotations
- Tenders

Owns:

```
sales_customers

sales_customer_contacts

sales_leads

sales_deals

sales_activities

sales_quotations

sales_quotation_items

sales_tenders
```

Depends on:

Platform

Administration

Exports:

```
CustomersFacade

SalesFacade
```

---

# Operations Module

Purpose:

Manage products and operational workflows.

Responsibilities:

- Product Categories
- Units
- Products
- Inventory
- Purchasing
- Delivery Orders
- Vendors

Owns:

```
ops_categories

ops_units

ops_products

ops_inventory_items

ops_inventory_movements

ops_purchase_orders

ops_purchase_order_items

ops_delivery_orders

ops_delivery_order_items

ops_vendors
```

Warehouses remain intentionally deferred.

Depends on:

Platform

Administration

Sales

Exports:

```
InventoryFacade

ProductsFacade

PurchasingFacade
```

---

# Finance Module

Purpose:

Manage financial transactions.

Responsibilities:

- Accounts
- Invoices
- Payments
- Expenses
- Journal Entries

Owns:

```
finance_accounts

finance_invoices

finance_invoice_items

finance_payments

finance_payment_allocations

finance_expenses

finance_journal_entries

finance_journal_lines
```

Depends on:

Platform

Sales

Operations

Exports:

```
FinanceFacade
```

---

# HR Module

Purpose:

Manage employees and payroll.

Responsibilities:

- Employees
- Attendance
- Leave
- Payroll
- Documents

Owns:

```
hr_employees

hr_departments

hr_designations

hr_attendance

hr_leave_requests

hr_leave_types

hr_holidays

hr_payroll_runs

hr_payroll_items

hr_documents
```

Depends on:

Platform

Administration

Exports:

```
HRFacade
```

---

# Executive Module

Purpose:

Provide management reporting.

Responsibilities:

- KPIs
- Dashboards
- Reports
- Analytics

Consumes information from:

- Sales
- Operations
- Finance
- HR

The Executive module owns very little business data.

Instead, it aggregates information from other modules.

---

# Module Dependency Rules

Allowed:

```text
Controller
    ↓
Service
    ↓
Repository
```

Allowed:

```text
Sales
    ↓
InventoryFacade
```

Allowed:

```text
Sales
    ↓
FinanceFacade
```

Allowed:

```text
Sales
    ↓
customer.created event
```

Forbidden:

```text
SalesRepository
    ↓
InventoryRepository
```

Forbidden:

```text
FinanceService
    ↓
CustomersRepository
```

Modules must never bypass another module's public interface.

---

# Shared Components

Shared functionality belongs in reusable packages or common libraries.

Examples:

```
Validation

Logging

Utilities

Environment

Database Client
```

Business rules do not belong in shared libraries.

---

# Future Modules

Potential future additions:

- Manufacturing
- POS
- Fleet
- Projects
- Asset Management
- Procurement Portal
- Customer Portal
- Supplier Portal
- Mobile App
- Workflow Engine

The architecture should support adding these modules without restructuring existing modules.

---

# Module Ownership Checklist

Before creating a new feature, answer:

1. Which module owns this?
2. Does a similar module already exist?
3. Should this be a shared service instead?
4. Does another module already expose the required functionality?
5. Can communication occur through a facade or event?

Only after these questions are answered should implementation begin.

---

# Guiding Principle

A module should be understandable, testable, and maintainable in isolation.

The goal is high cohesion within modules and low coupling between modules.
