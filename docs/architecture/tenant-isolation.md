# Tenant Isolation

## Status

Implemented for platform users, authentication sessions, and the current Sales/CRM tables.

## Security boundary

Tenant isolation is enforced twice:

1. repositories keep explicit tenant filters for readable intent and efficient query plans;
2. PostgreSQL Row-Level Security (RLS) prevents a query from reading or writing another tenant's rows even when an application filter is missing.

Application filtering is not a substitute for RLS. Both layers are required.

## Request flow

For an authenticated HTTP request:

1. the JWT strategy validates the token and loads the user inside the tenant identified by the signed `organizationId` claim;
2. the global tenant interceptor starts a database transaction;
3. the transaction sets `app.local_tenant_id` with PostgreSQL `set_config(..., true)`;
4. all calls through the shared `db` facade resolve to that transaction through `AsyncLocalStorage`;
5. RLS policies compare each row's tenant column with `app.current_tenant_id()`;
6. the transaction-local setting disappears when the request completes or fails.

The context cannot be changed to another tenant inside an active transaction.

## Protected tables

- `users` through `organization_id`;
- `auth_sessions` through `organization_id`;
- `sales_customers`;
- `sales_customer_contacts`;
- `sales_pipeline_stages`;
- `sales_leads`;
- `sales_opportunities`.

Policies use both `USING` and `WITH CHECK` and tables use `FORCE ROW LEVEL SECURITY`, so the table owner does not silently bypass the policies.

## Organization lookup exception

`organizations` is the tenant registry and is not currently protected by RLS. Login must resolve an organization code before a trusted tenant context exists. Public application endpoints do not expose the organization registry, and organization reads and mutations still filter by the authenticated organization ID.

If database credentials are ever exposed to untrusted reporting or support tools, split tenant discovery into a restricted lookup function and apply RLS to `organizations` as a separate migration.

## Background jobs and scripts

Code outside an authenticated HTTP request must call `withTenantContext(tenantId, callback)` before accessing a protected table. The owner bootstrap script sets the same transaction-local context before creating a user.

Never use the raw PostgreSQL client for tenant-owned business data.

## Adding a tenant-owned table

Every new tenant-owned table must:

- include a non-null UUID tenant column;
- reference `organizations.id`;
- index the tenant column and tenant-scoped access patterns;
- receive an RLS policy with `USING` and `WITH CHECK`;
- use `FORCE ROW LEVEL SECURITY`;
- be accessed within `withTenantContext` or an authenticated request;
- include an isolation test that attempts cross-tenant reads and writes.

## Verification

Unit tests verify that authenticated handlers enter tenant context and public handlers do not. The RLS migration must additionally be verified against PostgreSQL by creating two tenants and confirming that each tenant can only select and mutate its own records.
