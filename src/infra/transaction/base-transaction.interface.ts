import type { TransactionOptions } from '@mikro-orm/core';

export interface BaseTransaction<T = unknown> {
  execute<TResult>(
    callback: (transaction: T) => Promise<TResult>,
    options?: TransactionOptions,
  ): Promise<TResult>;
}
