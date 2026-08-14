import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';
import { LICENSE_MODULE_KEY } from './licensing.decorator';
import { LicensingService } from './licensing.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class LicensingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly licensing: LicensingService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user) return true;

    this.licensing.assertTenant(user.organizationId);
    const requiredModule =
      this.reflector.getAllAndOverride<string>(LICENSE_MODULE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.moduleFromPath(request.path);

    if (requiredModule) this.licensing.assertModule(requiredModule);
    if (WRITE_METHODS.has(request.method)) this.licensing.assertWritable();
    return true;
  }

  private moduleFromPath(path: string): string | undefined {
    if (/\/(customers|leads|opportunities|pipeline-stages)(\/|$)/.test(path)) {
      return 'sales';
    }
    if (/\/(users|company|organizations|audit-logs)(\/|$)/.test(path)) {
      return 'admin';
    }
    return undefined;
  }
}
