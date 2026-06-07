import { OmitType } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';

export class CreateRoleDto extends OmitType(Role, [
  'id',
  '_id',
  'createdAt',
  'updatedAt',
] as const) {}
