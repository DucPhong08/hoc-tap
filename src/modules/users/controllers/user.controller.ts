import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '@/infra/controllers/base-crud.controller';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserConditionDto } from '../dto/user-condition.dto';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseCrudControllerFactory(
  User,
  CreateUserDto,
  UpdateUserDto,
  UserConditionDto,
  { defaultRoles: [SystemRole.USER] },
) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
