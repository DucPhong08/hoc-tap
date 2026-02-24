import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../../infra/controllers/base-crud.controller';
import { UserModel } from '../../database/models/user.model';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

const BaseController = BaseCrudControllerFactory(
  UserModel,
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
      updateById: { roles: ['admin', 'user'] },
      updateByIds: { roles: ['admin'] },
      upsert: { roles: ['admin'] },
      getOneOrUpsert: { roles: ['admin'] },
      deleteById: { roles: ['admin'] },
      deleteByIds: { roles: ['admin'] },
    },
  },
);

@ApiTags('users')
@Controller('users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super(userService, 'User');
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Tìm người dùng theo email' })
  @ApiResponse({ status: 200, type: UserEntity })
  async findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }
}
