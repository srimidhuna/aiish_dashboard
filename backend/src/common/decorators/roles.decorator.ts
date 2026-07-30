import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles('admin')
 *
 * Marks a route as restricted to the given user role(s). Must be paired with
 * RolesGuard (applied after JwtAuthGuard so request.user is populated).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
