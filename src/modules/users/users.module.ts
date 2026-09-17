import { Module } from '@nestjs/common';
import { Entity } from '@/common/enums/entity.enum';
import { RepositoryProvider } from '@/infra/repositories/common/repository';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [UserController],
  providers: [RepositoryProvider(Entity.USER, UserRepository), UserService],
  exports: [UserService],
})
export class UsersModule {}
