import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudController } from '../../../common/controllers/base-crud.controller';
import { UserEntity } from '../repository/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../domain/user.service';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseCrudController<
  UserEntity,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly userService: UserService) {
    super(userService, 'User', UserEntity, CreateUserDto, UpdateUserDto);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, type: UserEntity })
  async findByEmail(@Param('email') email: string): Promise<UserEntity | null> {
    return this.userService.findByEmail(email);
  }
}
