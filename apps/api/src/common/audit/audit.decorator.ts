import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'auditEntity';

export const AuditEntity = (entityType: string) =>
  SetMetadata(AUDIT_ENTITY_KEY, entityType);
