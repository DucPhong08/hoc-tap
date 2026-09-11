import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '@/infra/controllers/base.controller';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserConditionDto } from '../dto/user-condition.dto';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseController(
  User,
  CreateUserDto,
  UpdateUserDto,
  UserConditionDto,
  { defaultRoles: [SystemRole.ADMIN] },
) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
