import type { BaseTransaction } from '../transaction/base-transaction.interface';

export interface BaseCrudServiceConfig<TContext = unknown> {
  notFoundMessage?: string;
  transaction?: BaseTransaction<TContext>;
}
