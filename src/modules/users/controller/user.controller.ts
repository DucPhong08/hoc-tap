import {
  Controller,
  Body,
  Param,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User, UserRecord } from '../domain/user.model';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/common/dto/pagination.dto';
import { UserService } from '../domain/user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const users = await this.userService.findAll({});
    const data = users.map((user) => UserResponseDto.fromDomain(user));
    return new PaginatedResponseDto(
      data,
      data.length,
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return UserResponseDto.fromDomain(user);
  }

  @Post()
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createDto: CreateUserDto): Promise<UserResponseDto> {
    const userRecord = new UserRecord(
      createDto.firstName,
      createDto.lastName,
      createDto.email,
    );
    const userData: Partial<User> = { record: userRecord };
    const user = await this.userService.create(userData);
    return UserResponseDto.fromDomain(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.userService.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    const userRecord = new UserRecord(
      updateDto.firstName || existingUser.record.firstName,
      updateDto.lastName || existingUser.record.lastName,
      updateDto.email || existingUser.record.email,
    );
    const userData: Partial<User> = { record: userRecord };
    const user = await this.userService.update(id, userData);
    return UserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.findByEmail(email);
    return user ? UserResponseDto.fromDomain(user) : null;
  }
}
