import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { from, mergeMap, Observable, of } from 'rxjs';

import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';
import { AUDIT_ENTITY_KEY } from './audit.decorator';
import { AuditService } from './audit.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuditedRequest = Request & {
  id?: string | number;
  user?: JwtPayload;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const entityType = this.reflector.getAllAndOverride<string>(
      AUDIT_ENTITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      SAFE_METHODS.has(request.method) ||
      !request.user ||
      !entityType
    ) {
      return next.handle();
    }

    const routeTemplate = this.getRouteTemplate(request);

    return next.handle().pipe(
      mergeMap((result: unknown) =>
        from(
          this.auditService.record({
            organizationId: request.user!.organizationId,
            actorUserId: request.user!.sub,
            action: `${request.method} ${routeTemplate}`,
            entityType,
            requestMethod: request.method,
            requestPath: routeTemplate,
            metadata: {
              routeParams: this.getRouteParams(request.params),
              responseStatus: response.statusCode,
            },
            ...this.optionalAuditFields(request, result),
          }),
        ).pipe(mergeMap(() => of(result))),
      ),
    );
  }

  private optionalAuditFields(
    request: AuditedRequest,
    result: unknown,
  ): Partial<{
    entityId: string;
    requestId: string;
    ipAddress: string;
    userAgent: string;
  }> {
    const entityId = this.findEntityId(request.params, result);
    const requestId =
      request.id === undefined ? undefined : String(request.id).slice(0, 100);
    const ipAddress = request.ip?.slice(0, 64);
    const userAgent = request.get('user-agent')?.slice(0, 500);

    return {
      ...(entityId ? { entityId } : {}),
      ...(requestId ? { requestId } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      ...(userAgent ? { userAgent } : {}),
    };
  }

  private findEntityId(
    params: Record<string, string | string[]>,
    result: unknown,
  ): string | undefined {
    const parameterId = Object.values(params)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => UUID_PATTERN.test(value));

    if (parameterId) {
      return parameterId;
    }

    if (typeof result === 'object' && result !== null && 'id' in result) {
      const id = (result as { id?: unknown }).id;

      if (typeof id === 'string' && UUID_PATTERN.test(id)) {
        return id;
      }
    }

    return undefined;
  }

  private getRouteTemplate(request: AuditedRequest): string {
    const routePath = (request.route as { path?: unknown } | undefined)?.path;
    const normalizedRoute =
      typeof routePath === 'string' ? routePath : request.path;

    return `${request.baseUrl}${normalizedRoute}`.slice(0, 500);
  }

  private getRouteParams(
    params: Record<string, string | string[]>,
  ): Record<string, string> | undefined {
    const entries = Object.entries(params);

    return entries.length > 0
      ? Object.fromEntries(
          entries.map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value,
          ]),
        )
      : undefined;
  }
}
