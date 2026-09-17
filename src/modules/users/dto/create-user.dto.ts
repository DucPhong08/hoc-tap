import { OmitType } from '@nestjs/swagger';
import { MaxLength, MinLength } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDto extends OmitType(User, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'role',
  'provider',
  'isActive',
  'failedLoginAttempts',
  'lockedUntil',
  'sessions',
  'sessionId',
] as const) {
  @MinLength(8)
  @MaxLength(100)
  declare password?: string;
}
