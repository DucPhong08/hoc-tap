import {
  Global,
  Module,
  type NestModule,
  type MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmConfigService } from './mikro-orm-config.service';
import { MigrationService } from './migration.service';
import { MikroOrmRequestContextMiddleware } from './mikro-orm-request-context.middleware';
import { RootConfig } from '../../config/root.config';
import { MAIN_ENTITIES } from '../../modules/database/entities/main.entities';
import { DB_CONTEXTS } from '../../modules/database/constants';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<RootConfig>) => {
        const ormConfigService = new MikroOrmConfigService(configService);
        const config = ormConfigService.createMikroOrmOptions(DB_CONTEXTS.MAIN);
        return {
          ...config,
          entities: MAIN_ENTITIES,
        };
      },
      contextName: DB_CONTEXTS.MAIN,
    }),
    MikroOrmModule.forFeature({
      entities: MAIN_ENTITIES,
      contextName: DB_CONTEXTS.MAIN,
    }),
  ],
  providers: [MigrationService, MikroOrmRequestContextMiddleware],
  exports: [MikroOrmModule],
})
export class OrmMikroModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(MikroOrmRequestContextMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
