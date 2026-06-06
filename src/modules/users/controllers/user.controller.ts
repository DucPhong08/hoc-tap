import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createCrudController } from '../../../infra/controllers/base-crud.controller';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from '../constant/constant';

const UserCrudController = createCrudController(
  User,
  CreateUserDto,
  UpdateUserDto,
  {
    defaultRoles: [Role.USER, Role.ADMIN],
    routes: {
      create: { roles: [Role.ADMIN] },
      getMany: true,
      getPage: true,
      getById: true,
      getOne: true,
      updateOne: { roles: [Role.ADMIN] },
      updateById: { roles: [Role.ADMIN, Role.USER] },
      updateByIds: { roles: [Role.ADMIN] },
      deleteOne: { roles: [Role.ADMIN] },
      deleteById: { roles: [Role.ADMIN] },
      deleteByIds: { roles: [Role.ADMIN] },
    },
  },
);

@ApiTags('users')
@Controller('users')
export class UserController extends UserCrudController {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userService.findByEmail(email);
  }
}
