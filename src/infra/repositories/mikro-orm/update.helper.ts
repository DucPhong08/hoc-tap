import { wrap } from '@mikro-orm/core';
import type { UpdateData } from '../../../common/interfaces/query';

const UPDATE_OPERATOR_KEYS = ['$set', '$inc', '$unset', '$push', '$pull'];

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object';
};

export class UpdateHelper {
  private static hasOperators<E>(data: UpdateData<E>): boolean {
    if (!isObjectRecord(data)) {
      return false;
    }

    return UPDATE_OPERATOR_KEYS.some((key) => key in data);
  }

  static apply<E extends object>(entity: E, data: UpdateData<E>): void {
    if (!UpdateHelper.hasOperators(data)) {
      wrap(entity).assign(data as any);
      return;
    }

    const entityRecord = entity as Record<string, unknown>;
    const operation = data as Record<string, unknown>;

    const setData = operation.$set;
    if (isObjectRecord(setData)) {
      wrap(entity).assign(setData as any);
    }

    const incData = operation.$inc;
    if (isObjectRecord(incData)) {
      for (const [key, value] of Object.entries(incData)) {
        if (typeof value !== 'number') {
          continue;
        }

        const current = entityRecord[key];
        if (typeof current === 'number') {
          entityRecord[key] = current + value;
        }
      }
    }

    const unsetData = operation.$unset;
    if (isObjectRecord(unsetData)) {
      for (const key of Object.keys(unsetData)) {
        entityRecord[key] = null;
      }
    }

    const pushData = operation.$push;
    if (isObjectRecord(pushData)) {
      for (const [key, value] of Object.entries(pushData)) {
        const list = entityRecord[key];
        if (Array.isArray(list)) {
          list.push(value);
        }
      }
    }

    const pullData = operation.$pull;
    if (isObjectRecord(pullData)) {
      for (const [key, value] of Object.entries(pullData)) {
        const list = entityRecord[key];
        if (!Array.isArray(list)) {
          continue;
        }

        const index = list.indexOf(value);
        if (index > -1) {
          list.splice(index, 1);
        }
      }
    }
  }
}
