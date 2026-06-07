import { OmitType } from '@nestjs/swagger';
import { Setting } from '../entities/setting.entity';

export class CreateSettingDto extends OmitType(Setting, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const) {}
