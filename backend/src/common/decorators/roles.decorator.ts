import { SetMetadata } from '@nestjs/common';

/**
 * Role-based access decorator. Use with RolesGuard to restrict a route to one
 * or more account roles, e.g. @Roles('OWNER') or @Roles('ADMIN', 'OWNER').
 */
export const ROLES_KEY = 'roles';
export type AppRole = 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'OWNER';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
