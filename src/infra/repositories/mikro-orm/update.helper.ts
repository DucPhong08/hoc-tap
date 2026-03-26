import { wrap } from '@mikro-orm/core';
import type {
  UpdateData,
  UpdateOperator,
} from '../../../common/interfaces/query';

const UPDATE_OPERATOR_KEYS = [
  '$set',
  '$inc',
  '$unset',
  '$push',
  '$pull',
] as const;

type MutableEntity = Record<string, unknown>;

export class UpdateHelper {
  static apply<E extends object>(entity: E, data: UpdateData<E>): void {
    if (!this.isObject(data)) {
      this.assign(entity, data as Partial<E>);
      return;
    }

    if (!this.hasOperatorPayload(data)) {
      this.assign(entity, data);
      return;
    }

    if (data.$set) {
      this.assign(entity, data.$set);
    }

    if (data.$inc) {
      this.applyIncrements(entity, data.$inc);
    }

    if (data.$unset) {
      this.applyUnset(entity, data.$unset);
    }

    if (data.$push) {
      this.applyPush(entity, data.$push);
    }

    if (data.$pull) {
      this.applyPull(entity, data.$pull);
    }
  }

  private static assign<E extends object>(entity: E, data: Partial<E>): void {
    wrap(entity).assign(data as object);
  }

  private static applyIncrements<E extends object>(
    entity: E,
    increments: Partial<Record<keyof E, number>>,
  ): void {
    const entityRecord = this.toMutableEntity(entity);

    for (const [fieldName, value] of Object.entries(increments)) {
      const currentValue = entityRecord[fieldName];

      if (typeof currentValue === 'number' && typeof value === 'number') {
        entityRecord[fieldName] = currentValue + value;
      }
    }
  }

  private static applyUnset<E extends object>(
    entity: E,
    fields: Partial<Record<keyof E, boolean>>,
  ): void {
    const entityRecord = this.toMutableEntity(entity);

    for (const fieldName of Object.keys(fields)) {
      entityRecord[fieldName] = null;
    }
  }

  private static applyPush<E extends object>(
    entity: E,
    values: Partial<Record<keyof E, unknown>>,
  ): void {
    const entityRecord = this.toMutableEntity(entity);

    for (const [fieldName, value] of Object.entries(values)) {
      const currentValue = entityRecord[fieldName];

      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      }
    }
  }

  private static applyPull<E extends object>(
    entity: E,
    values: Partial<Record<keyof E, unknown>>,
  ): void {
    const entityRecord = this.toMutableEntity(entity);

    for (const [fieldName, value] of Object.entries(values)) {
      const currentValue = entityRecord[fieldName];

      if (Array.isArray(currentValue)) {
        const index = currentValue.indexOf(value);

        if (index > -1) {
          currentValue.splice(index, 1);
        }
      }
    }
  }

  private static toMutableEntity<E extends object>(entity: E): MutableEntity {
    return entity as MutableEntity;
  }

  private static hasOperatorPayload<E extends object>(
    data: Record<string, unknown>,
  ): data is UpdateOperator<E> {
    return UPDATE_OPERATOR_KEYS.some((operator) => operator in data);
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
