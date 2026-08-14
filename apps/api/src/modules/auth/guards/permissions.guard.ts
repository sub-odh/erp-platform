import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {
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

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      return false;
    }

    return this.permissionsService.hasAll(
      request.user.organizationId,
      request.user.role,
      requiredPermissions,
    );
  }
}
