import { Global, Injectable, Module, NestMiddleware } from '@nestjs/common';
import {
  MikroOrmModule,
  MikroOrmModuleOptions,
  MikroOrmOptionsFactory,
  InjectMikroORM,
} from '@mikro-orm/nestjs';
import { RequestContext, MikroORM } from '@mikro-orm/core';
import { MigrationService } from './migration.service';
import { DB_CONTEXTS } from '@/database/database.constants';
import { DatabaseEnvReader } from './env/database-env';
import { DatabaseContextRegistry } from './registration/database-context.registry';
import { getEntitiesByContext } from './entity-registry.helper';

@Injectable()
class DatabaseConfigFactory implements MikroOrmOptionsFactory {
  private readonly env = new DatabaseEnvReader();
  private readonly registry = new DatabaseContextRegistry();

  createMikroOrmOptions(contextName?: string): MikroOrmModuleOptions {
    return {
      ...this.env.buildOptions(this.registry.get(contextName!)),
      contextName,
      autoLoadEntities: false,
      registerRequestContext: false,
    };
  }
}

@Injectable()
export class MultiOrmMiddleware implements NestMiddleware {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN) private readonly mainOrm: MikroORM,
    @InjectMikroORM(DB_CONTEXTS.LOGS) private readonly logsOrm: MikroORM,
  ) {}

  use(req: any, res: any, next: () => void) {
    RequestContext.create([this.mainOrm.em, this.logsOrm.em], next);
  }
}

const mainEntitiesFeature = MikroOrmModule.forFeature({
  entities: getEntitiesByContext(DB_CONTEXTS.MAIN),
  contextName: DB_CONTEXTS.MAIN,
});

const logsEntitiesFeature = MikroOrmModule.forFeature({
  entities: getEntitiesByContext(DB_CONTEXTS.LOGS),
  contextName: DB_CONTEXTS.LOGS,
});

@Global()
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useClass: DatabaseConfigFactory,
      contextName: DB_CONTEXTS.MAIN,
    }),
    MikroOrmModule.forRootAsync({
      useClass: DatabaseConfigFactory,
      contextName: DB_CONTEXTS.LOGS,
    }),
    mainEntitiesFeature,
    logsEntitiesFeature,
  ],
  providers: [
    MigrationService,
    MultiOrmMiddleware,
    ...(mainEntitiesFeature.providers ?? []),
    ...(logsEntitiesFeature.providers ?? []),
  ],
  exports: [
    MigrationService,
    MultiOrmMiddleware,
    MikroOrmModule,
    ...(mainEntitiesFeature.exports ?? []),
    ...(logsEntitiesFeature.exports ?? []),
  ],
})
export class MikroOrmDatabaseModule {}
