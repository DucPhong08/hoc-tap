import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserController } from './controller/user.controller';
import { UserService } from './domain/user.service';
import { UserRepository } from './repository/user.repository';
import { UserEntity } from './repository/entities/user.entity';
import { contexts } from '../../constants';
import { TransactionModule } from '../../common/transaction/transaction.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity], contexts.MAIN),
    TransactionModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UsersModule {}
