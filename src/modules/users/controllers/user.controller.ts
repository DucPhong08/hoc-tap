import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../../common/controllers/base-crud.controller';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ReqUser } from '../../../common/decorators/request-user.decorator';
import type { CurrentUserData } from '../../../common/decorators/request-user.decorator';

const BaseController = BaseCrudControllerFactory(
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  {
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
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, type: UserEntity })
  async findByEmail(
    @ReqUser() user: CurrentUserData,
    @Param('email') email: string,
  ): Promise<UserEntity | null> {
    return this.userService.findByEmail(user, email);
  }
}
