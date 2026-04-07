import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, LEVEL_KEY } from '../decorators/roles.decorator';
import { CustomLogger } from '../interfaces/custom-logger.service';

const ROLE_HIERARCHY: Record<string, number> = {
  ROOT: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: CustomLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requiredLevel = this.reflector.getAllAndOverride<number>(LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredLevel) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied');
    }

    const userRole = user.role.name;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;

    if (requiredLevel) {
      if (userLevel < requiredLevel) {
        this.logger.warn(`User ${user.username} attempted to access endpoint requiring level ${requiredLevel}`, 'RolesGuard');
        throw new ForbiddenException('Insufficient role level');
      }
      return true;
    }

    if (requiredRoles.length > 0) {
      if (!requiredRoles.includes(userRole)) {
        this.logger.warn(`User ${user.username} attempted to access endpoint requiring roles: ${requiredRoles.join(', ')}`, 'RolesGuard');
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    }

    return true;
  }
}