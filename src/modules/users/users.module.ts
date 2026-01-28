import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './domain/user.service';
import { UserRepository } from './repository/user.repository';
import { TransactionModule } from '../../common/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UsersModule {}
