import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@/common/constants/role.constant';

export const ROLES_KEY = 'roles';

export interface AuthorizeOptions {
  roles?: Role[];
}

/**
 * Decorator phân quyền chính:
 * - `@Authorize()` -> Mặc định chỉ Role.ADMIN được truy cập
 * - `@Authorize(Role.USER, Role.ADMIN)` -> Các vai trò được phép truy cập
 */
export function Authorize(...args: (Role | AuthorizeOptions)[]) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const opts = args[0];
    const roles = opts.roles?.length ? opts.roles : [Role.ADMIN];
    return applyDecorators(
      ApiBearerAuth(),
      SetMetadata(ROLES_KEY, roles.map(String)),
    );
  }

  const roles = args.filter((a): a is Role => typeof a === 'string');
  const targetRoles = roles.length ? roles : [Role.ADMIN];
  return applyDecorators(
    ApiBearerAuth(),
    SetMetadata(ROLES_KEY, targetRoles.map(String)),
  );
}

export const Authorization = Authorize;
