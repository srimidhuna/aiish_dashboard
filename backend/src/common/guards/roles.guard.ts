import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';

/**
 * RolesGuard
 *
 * Reads roles set via @Roles(...) and compares against request.user.role
 * (populated by JwtAuthGuard, which MUST run first). Routes with no @Roles()
 * metadata are allowed through untouched — this guard only restricts routes
 * that explicitly opt in.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const userRole = request.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    return true;
  }
}
