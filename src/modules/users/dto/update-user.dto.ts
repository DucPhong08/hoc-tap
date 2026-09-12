import { PartialType, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['firstName', 'lastName', 'avatar'] as const),
) {}
