import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserController } from './controller/user.controller';
import { UserService } from './domain/user.service';
import { UserRepository } from './repository/user.repository';
import { UserMapper } from './repository/user.mapper';
import { UserEntity } from './repository/entities/user.entity';
import { contexts } from '../constants';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity], contexts.MAIN)],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserMapper,
    { provide: 'IUserRepository', useClass: UserRepository },
  ],
  exports: [UserService],
})
export class UsersModule {}
