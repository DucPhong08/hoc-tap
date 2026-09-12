import { OmitType, PartialType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserConditionDto extends PartialType(
  OmitType(User, ['password', 'sessions', 'sessionId'] as const),
) {}
