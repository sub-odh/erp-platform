# Audit Logging

## Purpose

The audit trail records successful authenticated mutations so an organization can determine who changed which resource, through which API operation, and when.

Audit logging is part of the transaction boundary. If the audit insert fails, the associated business mutation fails and the tenant transaction rolls back.

## Captured fields

Each `platform_audit_logs` row contains:

- organization ID;
- actor user ID;
- stable action derived from the HTTP method and route template;
- logical entity type;
- entity UUID when it can be resolved from route parameters or the response;
- request method and route template;
- request ID when available;
- client IP address;
- truncated user-agent value;
- route parameters and response status;
- database-generated timestamp.

Request bodies, passwords, tokens, cookies, authorization headers, uploaded file contents, and response bodies are deliberately excluded.

## Coverage

The global interceptor audits successful authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests for controllers marked with `@AuditEntity`.

Current audited resources:

- authentication security actions such as password changes and session revocation;
- users and profiles;
- organization settings and branding;
- customers and contacts;
- leads;
- opportunities;
- pipeline stages.

Public login, token refresh, and logout requests do not have an authenticated actor and are not written to the tenant audit trail. Authentication-attempt security telemetry should be implemented separately because it has different retention and abuse-monitoring requirements.

Failed mutations are not recorded as successful audit events. Operational failures remain the responsibility of structured application logs.

## Append-only enforcement

PostgreSQL provides three independent protections:

1. RLS limits reads and inserts to `app.current_tenant_id()`;
2. no RLS policies permit updates or deletes;
3. a database trigger raises an exception before every update or delete, including attempts made by the table owner.

Audit records must never be edited to correct display information. Any future correction mechanism must append a new event referring to the original record.

## Reading the audit trail

`GET /api/v1/audit-logs` requires `platform.audit.read`. It supports pagination and exact filters for actor, entity type, and action. The initial role mappings grant this permission to `OWNER` and `ADMIN`.

## Adding coverage

Every new controller that mutates tenant data must:

1. use the authenticated tenant transaction;
2. declare a stable singular entity name with `@AuditEntity`;
3. avoid placing secrets or request bodies in audit metadata;
4. verify that successful mutations are recorded;
5. verify that failed mutations do not create an audit row.

## Future enrichment

The current milestone captures mutation identity and request context. Domain services may later add structured before/after fields for selected high-value workflows, with explicit redaction rules and payload-size limits. Sensitive fields must never be copied into those snapshots.
