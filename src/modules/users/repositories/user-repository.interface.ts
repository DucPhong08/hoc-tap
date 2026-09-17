import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import type { User } from '../entities/user.entity';

export interface IUserRepository<TContext = any> extends IBaseRepository<
  User,
  TContext
> {}
