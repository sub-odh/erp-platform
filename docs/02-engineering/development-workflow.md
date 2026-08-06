# Development Workflow

This document defines the standard development process for the ERP Platform.

Every feature, regardless of size, follows this workflow.

Following a consistent process keeps the project maintainable, testable, and easy to extend.

---

# Feature Lifecycle

Every feature progresses through the following stages.

```
Planning
    ↓
Architecture
    ↓
Database Design
    ↓
Drizzle Schema
    ↓
Migration
    ↓
Repository
    ↓
Service
    ↓
Controller
    ↓
Validation
    ↓
Authorization
    ↓
Frontend API
    ↓
Frontend Hooks
    ↓
Frontend Components
    ↓
Frontend Pages
    ↓
Testing
    ↓
Documentation
    ↓
Build Verification
    ↓
Commit
    ↓
Push
```

No stage should be skipped.

---

# 1. Planning

Before writing code:

- Understand the business problem.
- Identify the owning module.
- Review related modules.
- Check existing reusable components.
- Review the architecture documents.

Questions to answer:

- What is the feature?
- Which module owns it?
- Does a similar feature already exist?
- Can existing code be reused?

---

# 2. Database Design

If the feature requires data:

- Design the table(s).
- Choose proper relationships.
- Add indexes.
- Add tenant ownership where required.
- Add audit fields.

Every table should follow the database conventions.

---

# 3. Drizzle Schema

Implement the schema in the shared database package.

Typical steps:

1. Update schema files.
2. Build the database package.
3. Generate migration.
4. Review generated SQL.
5. Apply migration.

---

# 4. Backend Development

Each module follows the same structure.

```
Module

Controller

↓

Service

↓

Repository

↓

Database
```

Responsibilities:

Controller

- HTTP
- Validation
- Authentication
- Authorization

Service

- Business rules
- Transactions
- Coordination

Repository

- Database queries only

---

# 5. Frontend Development

Each feature should include:

- API functions
- Types
- Hooks
- Components
- Pages

Pages should remain small.

Complex logic belongs inside reusable components or hooks.

---

# 6. Testing

Before marking a feature complete:

Backend

- Verify endpoints.
- Test validation.
- Test permissions.

Frontend

- Verify forms.
- Verify navigation.
- Verify loading states.
- Verify empty states.
- Verify error handling.

---

# 7. Documentation

Every completed feature updates the documentation.

Possible updates:

- API documentation
- Module documentation
- Architecture
- Database
- Troubleshooting

Documentation is part of the implementation.

---

# 8. Build Verification

Always verify builds before committing.

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

No build errors are acceptable.

---

# 9. Commit

Review:

```powershell
git status

git diff

git add -A

git diff --cached
```

Commit with a meaningful message.

Examples:

```
feat: add customer management

fix: correct JWT validation

docs: update development workflow

refactor: extract customer repository
```

---

# 10. Push

Push only after:

- Successful builds
- Documentation updates
- Code review (when applicable)

---

# Definition of Done

A feature is complete only when:

- Database complete
- Backend complete
- Frontend complete
- Validation complete
- Authorization complete
- Tested
- Documented
- Builds successfully
- Committed
- Pushed

Anything less is considered work in progress.

---

# Development Principles

Always prefer:

- Small commits
- Small pull requests
- Reusable code
- Clear naming
- Strong typing
- Documentation

Avoid:

- Duplicate logic
- Large files
- Hidden business rules
- Direct database access from controllers
- Skipping documentation
