import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces @Roles(...) metadata against the authenticated account's role
 * (populated by JwtStrategy on req.user). OWNER implicitly satisfies any
 * ADMIN-gated route so the owner can reach every admin endpoint. Must be used
 * together with JwtAuthGuard so req.user is present.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const role: string | undefined = req.user?.role;
    if (!role) throw new ForbiddenException('Authentication required');

    // OWNER can access anything an ADMIN can, plus OWNER-only routes.
    const effective = new Set<string>([role]);
    if (role === 'OWNER') effective.add('ADMIN').add('MODERATOR');
    if (role === 'ADMIN') effective.add('MODERATOR');

    const allowed = required.some((r) => effective.has(r));
    if (!allowed) {
      throw new ForbiddenException('Insufficient privileges for this action');
    }
    return true;
  }
}
