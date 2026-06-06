import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator';
import { Role } from '../../modules/users/constant/constant';

export function Authorize(...roles: Role[]) {
  if (roles.length > 0) {
    return applyDecorators(ApiBearerAuth(), Roles(...roles));
  }
  return applyDecorators(ApiBearerAuth());
}
