import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator';

export function Authorize(...roles: string[]) {
  if (roles.length > 0) {
    return applyDecorators(ApiBearerAuth(), Roles(...roles));
  }
  return applyDecorators(ApiBearerAuth());
}
