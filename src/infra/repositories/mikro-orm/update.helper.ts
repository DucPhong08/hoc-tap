import { wrap } from '@mikro-orm/core';
import type { UpdateData } from '../../../common/types/repository.types';
import { isRecord } from './utils';

export const UPDATE_OPERATOR_KEYS = [
  '$set',
  '$inc',
  '$unset',
  '$push',
  '$pull',
] as const;

type MutableEntity = Record<string, unknown>;

export function applyUpdate<E extends object>(
  entity: E,
  data: UpdateData<E>,
): void {
  if (!isRecord(data) || !UPDATE_OPERATOR_KEYS.some((op) => op in data)) {
    wrap(entity).assign(data as object);
    return;
  }

  const record = entity as MutableEntity;

  for (const [op, payload] of Object.entries(data)) {
    if (!isRecord(payload)) continue;

    switch (op) {
      case '$set':
        wrap(entity).assign(payload as object);
        break;

      case '$inc':
        for (const [field, value] of Object.entries(payload)) {
          if (typeof value !== 'number') continue;
          const current = record[field];
          record[field] = typeof current === 'number' ? current + value : value;
        }
        break;

      case '$unset':
        for (const field of Object.keys(payload)) {
          record[field] = null;
        }
        break;

      case '$push':
        for (const [field, value] of Object.entries(payload)) {
          const current = record[field];
          if (Array.isArray(current)) {
            current.push(value);
          } else {
            record[field] = [value];
          }
        }
        break;

      case '$pull':
        for (const [field, value] of Object.entries(payload)) {
          const current = record[field];
          if (!Array.isArray(current)) continue;
          const index = current.indexOf(value);
          if (index > -1) current.splice(index, 1);
        }
        break;
    }
  }
}
