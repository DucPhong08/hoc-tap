import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import type { SessionEntity } from '../entities/session.entity';

export interface ISessionRepository<TContext = any> extends IBaseRepository<
  SessionEntity,
  TContext
> {}
