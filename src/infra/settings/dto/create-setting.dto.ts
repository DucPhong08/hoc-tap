import { OmitType } from '@nestjs/swagger';
import { SettingEntity } from '../entities/setting.entity';

export class CreateSettingDto extends OmitType(SettingEntity, [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const) {}
