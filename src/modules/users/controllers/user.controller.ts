import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '@/infra/controllers/base.controller';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserConditionDto } from '../dto/user-condition.dto';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import { Role } from '@/common/enums/role.enum';
import { UserService } from '../services/user.service';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseController(
  User,
  CreateUserDto,
  UpdateUserDto,
  UserConditionDto,
  { defaultRoles: [Role.ADMIN, Role.USER] },
) {
  constructor(private readonly userService: UserService) {
    super(userService);
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
