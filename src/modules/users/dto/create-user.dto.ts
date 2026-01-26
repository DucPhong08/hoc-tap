import { OmitType } from '@nestjs/swagger';
import { UserEntity } from '../repository/entities/user.entity';

export class CreateUserDto extends OmitType(UserEntity, [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
] as const) {}
