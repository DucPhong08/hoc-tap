import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { TransactionModule } from '../../infra/transaction/transaction.module';
import { UserEntity } from './entities/user.entity';
import { DB_CONTEXTS } from 'src/database/database.constants';

@Module({
  imports: [
    TransactionModule,
    MikroOrmModule.forFeature({
      entities: [UserEntity],
      contextName: DB_CONTEXTS.MAIN,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UsersModule {}
