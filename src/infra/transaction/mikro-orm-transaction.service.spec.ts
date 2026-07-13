import type { EntityManager, MikroORM } from '@mikro-orm/core';
import { MikroOrmTransactionService } from './mikro-orm-transaction.service';

describe('MikroOrmTransactionService', () => {
  const originalValue = process.env.DB_MAIN_DISABLE_TRANSACTIONS;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.DB_MAIN_DISABLE_TRANSACTIONS;
    } else {
      process.env.DB_MAIN_DISABLE_TRANSACTIONS = originalValue;
    }
    jest.restoreAllMocks();
  });

  it('uses a transaction when the environment value is false', async () => {
    process.env.DB_MAIN_DISABLE_TRANSACTIONS = 'false';
    const transactionEm = {} as EntityManager;
    const transactional = jest.fn(
      async (callback: (em: EntityManager) => Promise<string>) =>
        callback(transactionEm),
    );
    const orm = { em: { transactional } } as unknown as MikroORM;
    const service = new MikroOrmTransactionService(orm);

    await expect(
      service.execute((em) =>
        Promise.resolve(em === transactionEm ? 'tx' : 'root'),
      ),
    ).resolves.toBe('tx');
    expect(transactional).toHaveBeenCalledTimes(1);
  });

  it('uses the root entity manager only when explicitly disabled', async () => {
    process.env.DB_MAIN_DISABLE_TRANSACTIONS = 'true';
    const transactional = jest.fn();
    const rootEm = { transactional } as unknown as EntityManager;
    const service = new MikroOrmTransactionService({ em: rootEm } as MikroORM);

    await expect(
      service.execute((em) => Promise.resolve(em === rootEm ? 'root' : 'tx')),
    ).resolves.toBe('root');
    expect(transactional).not.toHaveBeenCalled();
  });
});
