import { Type } from '@nestjs/common';
import { GeneralInfo } from '../entities/value-objects/general-info';
import { MaintenanceSettings } from '../entities/value-objects/maintenance-settings';
import { SettingKey } from '../enums/setting-key.enum';

/**
 * Map từ SettingKey đến class entity tương ứng
 * Dùng để validate và transform data
 */
export const MAP_SETTING_ENTITY: { [key in SettingKey]?: Type<unknown> } = {
  [SettingKey.MAINTENANCE_SETTINGS]: MaintenanceSettings,
  [SettingKey.GENERAL_INFO]: GeneralInfo,
};

export type SettingValue<T> = T extends SettingKey.MAINTENANCE_SETTINGS
  ? MaintenanceSettings
  : T extends SettingKey.GENERAL_INFO
    ? GeneralInfo
    : Record<string, unknown>;
