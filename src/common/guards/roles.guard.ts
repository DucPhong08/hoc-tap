import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/authorize.decorator';
import { Role } from '@/common/enums/role.enum';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

interface RequestWithUser extends Omit<Request, 'user'> {
  user?: IAuthUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      return false;
    }

    const userRoles = user.roles ?? [];

    // Superuser ADMIN bypasses all checks
    if (userRoles.includes(Role.ADMIN)) {
      return true;
    }

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
