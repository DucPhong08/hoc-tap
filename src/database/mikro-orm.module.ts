import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MigrationService } from './migration.service';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { getEntitiesByContext } from './entity-registry.helper';
import { DatabaseContextRegistry } from './registration/database-context.registry';
import { DatabaseEnvironmentReader } from './env/database-environment.reader';
import { DatabaseEnvironmentValidator } from './env/database-environment.validator';
import { DatabaseContextConfigService } from './runtime/database-context-config.service';
import { PostgreSqlOptionsStrategy } from './options/postgresql-options.strategy';
import { MongoDbOptionsStrategy } from './options/mongodb-options.strategy';
import { DatabaseOptionsFactory } from './options/database-options.factory';
import { MainMikroOrmOptionsFactory } from './runtime/main-mikro-orm-options.factory';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useClass: MainMikroOrmOptionsFactory,
      contextName: DB_CONTEXTS.MAIN,
    }),
    MikroOrmModule.forFeature({
      entities: getEntitiesByContext(DB_CONTEXTS.MAIN),
      contextName: DB_CONTEXTS.MAIN,
    }),
  ],
  providers: [
    DatabaseContextRegistry,
    DatabaseEnvironmentReader,
    DatabaseEnvironmentValidator,
    DatabaseContextConfigService,
    PostgreSqlOptionsStrategy,
    MongoDbOptionsStrategy,
    DatabaseOptionsFactory,
    MainMikroOrmOptionsFactory,
    MigrationService,
  ],
  exports: [DatabaseContextConfigService, DatabaseOptionsFactory],
})
export class MikroOrmDatabaseModule {}
