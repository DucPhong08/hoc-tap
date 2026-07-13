import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import type { TransactionOptions } from '@mikro-orm/core';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { BaseTransaction } from './base-transaction.interface';
import { DB_CONTEXTS } from '@/database/database.constants';

@Injectable()
export class MikroOrmTransactionService implements BaseTransaction<EntityManager> {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN) private readonly orm: MikroORM,
  ) {}

  async execute<TResult>(
    callback: (transaction: EntityManager) => Promise<TResult>,
    options?: TransactionOptions,
  ): Promise<TResult> {
    const disableTransactions =
      process.env.DB_MAIN_DISABLE_TRANSACTIONS === 'true';

    if (disableTransactions) {
      return callback(this.orm.em);
    }

    return this.orm.em.transactional(async (em) => callback(em), options);
  }
}
