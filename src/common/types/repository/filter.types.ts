import type { FilterQuery } from '@mikro-orm/core';
import { OperatorType } from '../../enums/operator-type.enum';
import type { Paths } from './util.types';

export interface FilterRule<E = any> {
  field: Paths<E> | string[];
  operator: OperatorType;
  values?: any;
}

export type QueryCondition<E> = FilterQuery<E> | FilterRule<E>[];
