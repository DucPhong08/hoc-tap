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
    MikroOrmModule.forMiddleware(),
  ],
  providers: [MigrationService],
})
export class MikroOrmDatabaseModule {}
