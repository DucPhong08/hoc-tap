import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator';
import { SystemRole } from '../../modules/roles/enums/system-role.enum';

export function Authorize(...roles: string[]) {
  const targetRoles = roles.length > 0 ? roles : [SystemRole.ADMIN];
  return applyDecorators(ApiBearerAuth(), Roles(...targetRoles));
}
