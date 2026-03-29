import { Module } from '@nestjs/common';
import { MikroOrmTransactionService } from './mikro-orm-transaction.service';
import {
  TransactionProvider,
  TRANSACTION_PROVIDER,
} from './transaction.provider';

@Module({
  providers: [
    MikroOrmTransactionService,
    TransactionProvider(MikroOrmTransactionService),
  ],
  exports: [MikroOrmTransactionService, TRANSACTION_PROVIDER],
})
export class TransactionModule {}
