import { EntityManager } from '@mikro-orm/core';
import { Injectable, Optional } from '@nestjs/common';
import { ApiError } from '@/common/exceptions/api-error';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { BaseCrudService } from '@/infra/services/base-crud.service';
import { Setting } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import type { User } from '@/modules/users/entities/user.entity';
import type { BaseTransaction } from '@/infra/transaction/base-transaction.interface';
import { InjectTransaction } from '@/infra/transaction/transaction.provider';
import {
  MAP_SETTING_ENTITY,
  SettingValue,
} from '../constants/setting-key.constant';
import { SettingKey } from '../enums/setting-key.enum';

@Injectable()
export class SettingService extends BaseCrudService<Setting, EntityManager> {
  constructor(
    private readonly settingRepository: SettingRepository,
    @Optional()
    @InjectTransaction()
    transaction?: BaseTransaction<EntityManager>,
  ) {
    super(settingRepository, {
      transaction,
    });
  }

  async getSettingValue<T extends SettingKey>(
    key: T,
  ): Promise<SettingValue<T> | null> {
    const setting = await this.settingRepository.getOne({ key });
    if (!setting) {
      return null;
    }
    return setting.value as SettingValue<T>;
  }

  /**
   * Set giá trị setting với validation
   */
  async setSettingValue<T extends SettingKey>(
    user: User | null,
    key: T,
    value: SettingValue<T>,
  ): Promise<Setting> {
    const ValueClass = MAP_SETTING_ENTITY[key];

    if (ValueClass) {
      const valueFromClass = plainToClass(ValueClass, value);
      const validateResult = await validate(valueFromClass as any, {
        whitelist: true,
        stopAtFirstError: true,
      });

      if (validateResult.length > 0) {
        console.error('Setting validation failed:', validateResult);
        throw ApiError.BadReq('error-setting-invalid');
      }
    }

    return this.executeWithTransaction(undefined, async (txOptions) => {
      const existing = await this.settingRepository.getOne({ key }, txOptions);

      if (existing) {
        return super.updateById(
          user,
          existing.id,
          { value: value as any },
          txOptions,
        );
      }

      return super.create(
        user,
        {
          key,
          value: value as any,
        },
        txOptions,
      );
    });
  }

  async getSettingValues(keys: SettingKey[]): Promise<Record<string, any>> {
    const settings = await Promise.all(
      keys.map(async (key) => {
        try {
          const value = await this.getSettingValue(key as any);
          return { key, value };
        } catch {
          return { key, value: null };
        }
      }),
    );

    return settings.reduce(
      (acc, { key, value }) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
