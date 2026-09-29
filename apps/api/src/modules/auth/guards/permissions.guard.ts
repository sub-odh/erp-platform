import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { decideApi, type AppRole } from '../role-access';

import {
  PERMISSIONS_ANY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';
import type { PermissionCode } from '../permissions/permission.constants';
import { PermissionsService } from '../permissions/permissions.service';
import type { JwtPayload } from '../types/jwt-payload.type';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndMerge<
      PermissionCode[]
    >(PERMISSIONS_KEY, [context.getClass(), context.getHandler()]);

    const anyPermissions = this.reflector.getAllAndMerge<PermissionCode[]>(
      PERMISSIONS_ANY_KEY,
      [context.getClass(), context.getHandler()],
    );

    if (!requiredPermissions?.length && !anyPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      return false;
    }

    const phpDecision = decideApi(
      request.method,
      request.originalUrl || request.url || '',
      request.user.role as AppRole,
    );

    if (phpDecision.matched) {
      if (!phpDecision.allowed) {
        throw new ForbiddenException('Unauthorized');
      }

      return true;
    }

    if (requiredPermissions?.length) {
      const hasAll = await this.permissionsService.hasAll(
        request.user.organizationId,
        request.user.role,
        requiredPermissions,
      );

      if (!hasAll) {
        return false;
      }
    }

    if (anyPermissions?.length) {
      return this.permissionsService.hasAny(
        request.user.organizationId,
        request.user.role,
        anyPermissions,
      );
    }

    return true;
  }
}
