# Notifications

Notifications are a shared platform capability. They are stored locally, tenant-isolated, recipient-scoped by the API, and do not depend on internet connectivity.

## Data model and isolation

`platform_notifications` stores the recipient, optional actor, type, display content, action URL, related entity, metadata, and read timestamp. `platform_notification_email_outbox` stores durable email delivery work. Both tables use forced PostgreSQL row-level security against the request tenant context.

The API additionally includes both `organizationId` and `recipientUserId` in every inbox, unread-count, and read-state query. A notification producer validates that the recipient is active and belongs to the same organization before inserting anything.

## API

- `GET /api/v1/notifications?page=1&limit=20` lists the current user's notifications.
- Add `unreadOnly=true` to list unread notifications only.
- `GET /api/v1/notifications/unread-count` returns the badge count.
- `PATCH /api/v1/notifications/:id/read` marks one owned notification read.
- `PATCH /api/v1/notifications/read-all` marks all current-user notifications read.

Read-state mutations are audit logged. The global license policy applies, so an expired read-only deployment continues to display the inbox but does not mutate read state.

## Producers

The current event-driven producers cover:

- lead assignment and reassignment;
- opportunity assignment and reassignment;
- opportunity pipeline-stage changes;
- new-user welcome messages.

Producers call the shared `NotificationsService` after the business mutation. Because the request tenant transaction is still active, the in-app record and email outbox entry commit with the business operation. Notifications caused by a user's own action are suppressed to avoid noise.

## Email outbox

`EMAIL_DELIVERY_MODE` defaults to `smtp`. Each company configures its own host, port, encryption mode, username, password, sender address, and sender name from **Administration → SMTP Settings**. A connection test verifies the saved transport before it is used. Companies without an active SMTP configuration retain their messages safely in the queue without consuming retry attempts. Set the mode to `log` for local testing or `disabled` to pause delivery globally.

The worker limits batches, prevents overlapping runs, processes every company inside its tenant context, retries failed deliveries with exponential backoff, and marks an item `FAILED` after five attempts. SMTP passwords are encrypted with AES-256-GCM before storage and are never returned by the API. `SMTP_CREDENTIAL_ENCRYPTION_KEY` supplies the deployment-side encryption secret and must be unique and protected in production.

SMTP administration endpoints require `platform.smtp.manage`:

- `GET /api/v1/smtp/current` returns the masked company configuration;
- `PATCH /api/v1/smtp/current` creates or updates it;
- `POST /api/v1/smtp/current/test` verifies the active connection.

## Web behavior

The topbar bell polls the small unread-count endpoint once per minute. Opening it loads the most recent notifications. Users can mark one or all items read, and selecting an item navigates to its action URL.
