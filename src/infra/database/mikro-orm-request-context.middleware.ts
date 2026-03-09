import { Injectable, type NestMiddleware } from '@nestjs/common';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import type { Request, Response } from 'express';
import { DB_CONTEXTS } from '../../modules/database/constants';

@Injectable()
export class MikroOrmRequestContextMiddleware implements NestMiddleware {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    private readonly mainEntityManager: EntityManager,
    @InjectEntityManager(DB_CONTEXTS.LOGS)
    private readonly logsEntityManager: EntityManager,
  ) {}

  use(_req: Request, _res: Response, next: () => void): void {
    RequestContext.create(
      [this.mainEntityManager, this.logsEntityManager],
      next,
    );
  }
}
