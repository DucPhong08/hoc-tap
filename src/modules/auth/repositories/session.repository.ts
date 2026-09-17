import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from '@/database/entity-registry';
import { SessionEntity } from '../entities/session.entity';
import type { ISessionRepository } from './session-repository.interface';

@Injectable()
export class SessionRepository
  extends MikroOrmBaseRepository<SessionEntity>
  implements ISessionRepository
{
  constructor(
    @InjectEntityRepository(SessionEntity)
    private readonly sessionRepo: EntityRepository<SessionEntity>,
  ) {
    super(sessionRepo);
  }
}
