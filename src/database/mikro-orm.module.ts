import {
  Global,
  Inject,
  Injectable,
  Module,
  NestMiddleware,
} from '@nestjs/common';
import { MikroOrmModule, getMikroORMToken } from '@mikro-orm/nestjs';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { DB_ORMS } from './database.constants';
import { DB_CONTEXT_NAMES, context } from './database.contexts';
import { entitiesOf } from './entity-registry';
import { MigrationService } from './migration.service';
import { databaseOptions } from './env/database.options';

const roots = DB_CONTEXT_NAMES.map((name) =>
  MikroOrmModule.forRootAsync({
    contextName: name,
    useFactory: () => ({
      ...databaseOptions(context(name)),
      contextName: name,
      autoLoadEntities: false,
      registerRequestContext: false,
    }),
  }),
);

const features = DB_CONTEXT_NAMES.map((name) =>
  MikroOrmModule.forFeature({ entities: entitiesOf(name), contextName: name }),
);

const ormsProvider = {
  provide: DB_ORMS,
  useFactory: (...orms: MikroORM[]) => orms,
  inject: DB_CONTEXT_NAMES.map((name) => getMikroORMToken(name)),
};

@Injectable()
export class MultiOrmMiddleware implements NestMiddleware {
  constructor(@Inject(DB_ORMS) private readonly orms: MikroORM[]) {}

  use(_req: unknown, _res: unknown, next: () => void) {
    RequestContext.create(
      this.orms.map((orm) => orm.em),
      next,
    );
  }
}

@Global()
@Module({
  imports: [...roots, ...features],
  providers: [ormsProvider, MigrationService, MultiOrmMiddleware],
  exports: [
    ormsProvider,
    MigrationService,
    MultiOrmMiddleware,
    MikroOrmModule,
    ...features,
  ],
})
export class MikroOrmDatabaseModule {}
