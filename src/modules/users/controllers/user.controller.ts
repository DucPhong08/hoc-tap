import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@/infra/controllers/base.controller';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from '../dto/update-user.dto';
import { UserConditionDto } from '../dto/user-condition.dto';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import { Role } from '@/common/constants/role.constant';
import { UserService } from '../services/user.service';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseController(
  User,
  CreateUserDto,
  UpdateUserDto,
  UserConditionDto,
  {
    defaultRoles: [Role.ADMIN],
    routes: {
      create: { enabled: false },
      updateOne: { enabled: false },
      updateByIds: { enabled: false },
      deleteOne: { enabled: false },
      deleteByIds: { enabled: false },
    },
  },
) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Patch('profile')
  @Authorize(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  async updateProfile(
    @ReqUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<User | null> {
    return this.userService.updateProfile(user, dto);
  }

  @Get('list-all')
  @Authorize(Role.ADMIN)
  async findAll(@ReqUser() user: User): Promise<User[]> {
    return this.userService.getMany(user, {});
  }

  @Post('admin-create')
  @Authorize(Role.ADMIN)
  async adminCreate(
    @ReqUser() user: User,
    @Body() dto: CreateUserDto,
  ): Promise<User> {
    return this.userService.create(user, dto);
  }
}
