import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../../common/controllers/base-crud.controller';
import { UserEntity } from '../repository/entities/user.entity';
import { UserService } from '../domain/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
// import { RolesGuard } from '@/common/guards/roles.guard';

// Tạo base class với đầy đủ config
const BaseController = BaseCrudControllerFactory(
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  {
    routes: {
      getMany: {
        enabled: true,
        authorize: false,
      },

      getPage: {
        enabled: true,
        authorize: false,
      },

      getOne: {
        enabled: true,
        authorize: false,
      },

      create: {
        enabled: true,
        authorize: true,
        roles: ['admin'],
      },

      update: {
        enabled: true,
        authorize: true,
        roles: ['admin', 'user'],
      },

      delete: false,
    },
  } as any,
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
  async findByEmail(@Param('email') email: string): Promise<UserEntity | null> {
    return this.userService.findByEmail(email);
  }
}
