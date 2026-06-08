import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { TransactionModule } from '../../infra/transaction/transaction.module';
import { registerEntities } from 'src/database/entity-registry.helper';
import { User } from './entities/user.entity';

@Module({
  imports: [TransactionModule, ...registerEntities([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UsersModule {}
