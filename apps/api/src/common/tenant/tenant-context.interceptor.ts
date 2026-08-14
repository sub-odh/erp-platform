import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, lastValueFrom, Observable } from 'rxjs';

import { withTenantContext } from '@erp/db';

import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

interface AuthenticatedRequest {
  user?: JwtPayload;
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.user?.organizationId;

    if (!tenantId) {
      return next.handle();
    }

    return from(
      withTenantContext(tenantId, () => lastValueFrom(next.handle())),
    );
  }
}
