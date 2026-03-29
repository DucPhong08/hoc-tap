import { wrap } from '@mikro-orm/core';
import type {
  UpdateData,
  UpdateOperator,
} from '../../../common/types/repository.types';

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
    if (!this.isRecord(data) || !this.hasOperatorPayload(data)) {
      this.assign(entity, data);
      return;
    }

    const operatorData = data;
    const entityRecord = entity as MutableEntity;

    if (operatorData.$set) {
      this.assign(entity, operatorData.$set);
    }

    if (operatorData.$inc) {
      for (const [fieldName, value] of Object.entries(operatorData.$inc)) {
        const currentValue = entityRecord[fieldName];

        if (typeof value === 'number') {
          entityRecord[fieldName] =
            typeof currentValue === 'number' ? currentValue + value : value;
        }
      }
    }

    if (operatorData.$unset) {
      for (const fieldName of Object.keys(operatorData.$unset)) {
        entityRecord[fieldName] = null;
      }
    }

    if (operatorData.$push) {
      for (const [fieldName, value] of Object.entries(operatorData.$push)) {
        const currentValue = entityRecord[fieldName];

        if (Array.isArray(currentValue)) {
          currentValue.push(value);
        } else {
          entityRecord[fieldName] = [value];
        }
      }
    }

    if (operatorData.$pull) {
      for (const [fieldName, value] of Object.entries(operatorData.$pull)) {
        const currentValue = entityRecord[fieldName];

        if (Array.isArray(currentValue)) {
          const index = currentValue.indexOf(value);

          if (index > -1) {
            currentValue.splice(index, 1);
          }
        }
      }
    }
  }

  private static assign<E extends object>(entity: E, data: Partial<E>): void {
    wrap(entity).assign(data as object);
  }

  private static hasOperatorPayload<E extends object>(
    data: Record<string, unknown>,
  ): data is UpdateOperator<E> {
    return UPDATE_OPERATOR_KEYS.some((operator) => operator in data);
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
