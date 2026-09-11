import { Global, Injectable, Module } from '@nestjs/common';
import {
  MikroOrmModule,
  MikroOrmModuleOptions,
  MikroOrmOptionsFactory,
} from '@mikro-orm/nestjs';
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
      autoLoadEntities: false,
      registerRequestContext: false,
    };
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
    MikroOrmModule.forMiddleware(),
  ],
  providers: [
    MigrationService,
    ...(mainEntitiesFeature.providers ?? []),
    ...(logsEntitiesFeature.providers ?? []),
  ],
  exports: [
    MigrationService,
    MikroOrmModule,
    ...(mainEntitiesFeature.exports ?? []),
    ...(logsEntitiesFeature.exports ?? []),
  ],
})
export class MikroOrmDatabaseModule {}
