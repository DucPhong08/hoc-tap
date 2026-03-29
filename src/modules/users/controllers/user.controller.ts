import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createCrudController } from '../../../infra/controllers/base-crud.controller';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

const UserCrudController = createCrudController(
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  {
    defaultRoles: ['user', 'admin'],
    routes: {
      create: { roles: ['admin'] },
      getMany: true,
      getPage: true,
      getById: true,
      getOne: true,
      updateOne: { roles: ['admin'] },
      updateById: { roles: ['admin', 'user'] },
      updateByIds: { roles: ['admin'] },
      deleteOne: { roles: ['admin'] },
      deleteById: { roles: ['admin'] },
      deleteByIds: { roles: ['admin'] },
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
  async findByEmail(@Param('email') email: string): Promise<UserEntity | null> {
    return this.userService.findByEmail(email);
  }
}
