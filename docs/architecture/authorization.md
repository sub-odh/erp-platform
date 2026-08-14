# Authorization and Permissions

## Model

Authentication establishes who the user is. Authorization determines what the authenticated user may do.

The API uses database-backed permissions instead of embedding role names in controllers. Roles remain the convenient assignment unit, while permissions are the stable contract used by routes and business operations.

## Tables

- `platform_permissions` is the global permission catalog.
- `platform_role_permissions` assigns catalog entries to a role within one organization.

Role assignments are tenant-owned and protected by PostgreSQL Row-Level Security. Permission catalog rows are global because permission codes are defined by the installed application version.

## Initial permissions

- `platform.users.manage`
- `platform.organization.manage`
- `sales.crm.access`
- `sales.crm.permanent-delete`

The initial migration preserves existing behavior:

- `OWNER` and `ADMIN` receive every current permission;
- `MANAGER` and `STAFF` receive CRM access;
- permanent deletion remains limited to owners and administrators.

These are baseline mappings, not hard-coded guard behavior. Future administration screens may update the tenant's role-permission assignments.

## Controller usage

Protected controllers use JWT authentication followed by `PermissionsGuard` and declare requirements with `@RequirePermissions(...)`.

Class-level and handler-level permissions are merged. This allows a controller to require general module access while a destructive handler adds a stronger permission.

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class OpportunitiesController {
  @Delete(':id/permanent')
  @RequirePermissions(PERMISSIONS.CRM_PERMANENT_DELETE)
  permanentlyDelete() {}
}
```

All declared permissions must be granted. Authentication guards must run before `PermissionsGuard` so the signed organization and role are available.

## Adding a permission

1. Add the code to `PERMISSIONS`.
2. Add the catalog row and default role mappings in a migration.
3. Add the mapping to `DEFAULT_ROLE_PERMISSIONS` for newly created organizations.
4. Apply `@RequirePermissions` at the narrowest useful controller or handler boundary.
5. Add allowed and denied authorization tests.
6. Document the business meaning of the permission.

Permission codes should describe capabilities rather than screens. Do not check role names inside new controllers. Business services should perform additional ownership or workflow checks when permission alone is insufficient.
