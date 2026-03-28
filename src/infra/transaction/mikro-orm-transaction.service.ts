import { Injectable } from '@nestjs/common';
import { EntityManager, IsolationLevel, MikroORM } from '@mikro-orm/core';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import {
  BaseTransaction,
  TransactionOption,
} from './base-transaction.interface';
import { DB_CONTEXTS } from '../../database/database.constants';

@Injectable()
export class MikroOrmTransactionService implements BaseTransaction<EntityManager> {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN) private readonly orm: MikroORM,
  ) {}

  async startTransaction(
    options?: TransactionOption<EntityManager>,
  ): Promise<EntityManager> {
    const em = this.orm.em.fork();

    const isolationLevel = this.mapIsolationLevel(options?.isolationLevel);

    await em.begin({ isolationLevel });

    return em;
  }

  async commitTransaction(transaction: EntityManager): Promise<EntityManager> {
    await transaction.commit();
    return transaction;
  }

  async abortTransaction(transaction: EntityManager): Promise<EntityManager> {
    await transaction.rollback();
    return transaction;
  }

  private mapIsolationLevel(level?: string): IsolationLevel | undefined {
    if (!level) return undefined;

    const mapping: Record<string, IsolationLevel> = {
      READ_UNCOMMITTED: IsolationLevel.READ_UNCOMMITTED,
      READ_COMMITTED: IsolationLevel.READ_COMMITTED,
      REPEATABLE_READ: IsolationLevel.REPEATABLE_READ,
      SERIALIZABLE: IsolationLevel.SERIALIZABLE,
    };

    return mapping[level];
  }
}
