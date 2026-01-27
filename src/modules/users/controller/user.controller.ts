import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../../common/controllers/base-crud.controller';
import { UserEntity } from '../repository/entities/user.entity';
import { UserService } from '../domain/user.service';

@ApiTags('users')
@Controller('users')
export class UserController extends BaseCrudControllerFactory(UserEntity) {
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
