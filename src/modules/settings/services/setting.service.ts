import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { BaseService } from '@/infra/services/base.service';
import { Setting } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import type { FindQuery } from '@/common/interfaces/repository.interface';
import type { User } from '@/modules/users/entities/user.entity';
import {
  MAP_SETTING_ENTITY,
  SettingValue,
} from '../constants/setting-key.constant';
import { SettingKey } from '../enums/setting-key.enum';

@Injectable()
export class SettingService extends BaseService<Setting> {
  private readonly logger = new Logger(SettingService.name);

  constructor(private readonly settingRepository: SettingRepository) {
    super(settingRepository);
  }

  async getValue<T extends SettingKey>(
    key: T,
  ): Promise<SettingValue<T> | null> {
    const setting = await this.settingRepository.getOne({ key });
    if (!setting) {
      return null;
    }
    return setting.value as SettingValue<T>;
  }

  async setValue<T extends SettingKey>(
    user: User,
    key: T,
    value: SettingValue<T>,
    query?: FindQuery<Setting>,
  ): Promise<Setting> {
    const ValueClass = MAP_SETTING_ENTITY[key];

    if (ValueClass) {
      const valueFromClass = plainToClass(ValueClass, value);
      const validateResult = await validate(valueFromClass as any, {
        whitelist: true,
        stopAtFirstError: true,
      });

      if (validateResult.length > 0) {
        this.logger.error(
          'Setting validation failed',
          JSON.stringify(validateResult),
        );
        throw new BadRequestException('error-setting-invalid');
      }
    }

    const existing = await this.settingRepository.getOne({ key }, query);

    if (existing) {
      const updated = await super.updateById(
        user,
        existing.id,
        { value: value as any },
        query,
      );
      return updated!;
    }

    return super.create(
      user,
      {
        key,
        value: value as any,
      },
      query,
    );
  }

  async getValues(keys: SettingKey[]): Promise<Record<string, any>> {
    if (!keys.length) return {};

    const settings = await this.settingRepository.getMany({
      key: { $in: keys },
    });

    const settingMap = new Map(settings.map((s) => [s.key, s.value]));

    return keys.reduce(
      (acc, key) => {
        acc[key] = settingMap.get(key) ?? null;
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
