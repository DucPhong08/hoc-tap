import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../../infra/controllers/base-crud.controller';
import { Role } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleConditionDto } from '../dto/role-condition.dto';

@ApiTags('roles')
@Controller('roles')
export class RoleController extends BaseCrudControllerFactory(
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  RoleConditionDto,
) {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }
}
