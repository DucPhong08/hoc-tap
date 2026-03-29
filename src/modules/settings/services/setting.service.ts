import { EntityManager } from '@mikro-orm/core';
import { Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { SettingEntity } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import type { BaseTransaction } from '../../../infra/transaction/base-transaction.interface';
import { InjectTransaction } from '../../../infra/transaction/transaction.provider';
import {
  MAP_SETTING_ENTITY,
  SettingValue,
} from '../constants/setting-key.constant';
import { SettingKey } from '../enums/setting-key.enum';

@Injectable()
export class SettingService extends BaseCrudService<
  SettingEntity,
  EntityManager
> {
  constructor(
    private readonly settingRepository: SettingRepository,
    @InjectTransaction()
    transaction: BaseTransaction<EntityManager>,
  ) {
    super(settingRepository, {
      transaction,
    });
  }

  async getSettingValue<T extends SettingKey>(
    key: T,
  ): Promise<SettingValue<T> | null> {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) {
      return null;
    }
    return setting.value as SettingValue<T>;
  }

  /**
   * Set giá trị setting với validation
   */
  async setSettingValue<T extends SettingKey>(
    key: T,
    value: SettingValue<T>,
  ): Promise<SettingEntity> {
    const ValueClass = MAP_SETTING_ENTITY[key];

    if (ValueClass) {
      const valueFromClass = plainToClass(ValueClass, value);
      const validateResult = await validate(valueFromClass as any, {
        whitelist: true,
        stopAtFirstError: true,
      });

      if (validateResult.length > 0) {
        console.error('Setting validation failed:', validateResult);
        throw new BadRequestException('Setting value is invalid');
      }
    }

    return this.executeWithTransaction(undefined, async (txOptions) => {
      const existing = await this.settingRepository.findByKey(key, txOptions);

      if (existing) {
        return super.updateById(
          existing.id,
          { value: value as any },
          txOptions,
        );
      }

      return super.create(
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
