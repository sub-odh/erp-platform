# ERP Platform Documentation

Welcome to the ERP Platform documentation.

This documentation contains everything required to understand, develop, deploy, and maintain the ERP Platform.

---

# Documentation Structure

```
docs/

├── README.md
│
├── 01-architecture/
├── 02-engineering/
├── 03-adr/
├── 04-database/
├── 05-api/
├── 06-modules/
├── 07-deployment/
├── 08-security/
├── 09-roadmap/
│
└── legacy-database/
```

---

# Documentation Guide

## 01 — Architecture

System design and long-term architectural decisions.

Contents

- Architecture Overview
- System Design
- Database Design
- Module Map
- Coding Standards
- Architecture Decisions

---

## 02 — Engineering

Daily development guide.

Contents

- Getting Started
- Development Workflow
- Git Workflow
- Project Structure
- Useful Commands
- Troubleshooting

---

## 03 — ADR

Architecture Decision Records.

Every important engineering decision should have an ADR.

Examples

- Why PostgreSQL?
- Why Drizzle?
- Why Modular Monolith?
- Why JWT?

---

## 04 — Database

Everything related to PostgreSQL.

Contents

- Schema Design
- Migrations
- Drizzle
- RLS
- Indexes
- ERD
- Naming Conventions

---

## 05 — API

REST API documentation.

Each business module has its own document.

Examples

- Authentication
- Users
- Customers
- Inventory
- Finance

---

## 06 — Modules

Business documentation.

Each ERP module has its own document describing

Purpose

Database

Business Rules

Screens

Workflow

Future Improvements

---

## 07 — Deployment

Infrastructure documentation.

Includes

Docker

Production

Backups

Nginx

Environment Variables

Deployment Checklist

---

## 08 — Security

Security standards.

Includes

Authentication

Authorization

JWT

Refresh Tokens

Secrets

Permissions

RLS

Audit

---

## 09 — Roadmap

Project planning.

Contains

Current Status

Milestones

Future Modules

Version Planning

Release Notes

---

# Documentation Rules

Documentation is part of the implementation.

A feature is not complete until:

- Code is finished.
- Tests pass.
- Documentation is updated.

---

# Current Project Status

Platform

- Authentication ✔
- Organizations ✔
- Users ✔
- Sessions ✔

Next Module

- Customers

---

# Development Philosophy

The ERP is built as a modular monolith.

Every module owns:

- Database
- Repository
- Service
- Controller
- DTOs
- Validation
- Tests
- Documentation

Business logic must remain inside its own module.

Shared functionality should be extracted into reusable libraries whenever possible.

---

This documentation will evolve together with the ERP Platform.
