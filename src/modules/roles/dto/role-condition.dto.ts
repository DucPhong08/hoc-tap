import { PartialType } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';

export class RoleConditionDto extends PartialType(Role) {}
