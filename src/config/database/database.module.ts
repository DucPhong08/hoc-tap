import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmConfigService } from '../../infra/mikro-orm-config.service';
import { RootConfig } from '../root.config';
import { MAIN_ENTITIES, DB_CONTEXTS } from './entities.config';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<RootConfig>) => {
        const ormConfigService = new MikroOrmConfigService(configService);
        return ormConfigService.createMikroOrmOptions(DB_CONTEXTS.MAIN);
      },
      contextName: DB_CONTEXTS.MAIN,
    }),
    MikroOrmModule.forFeature(MAIN_ENTITIES, DB_CONTEXTS.MAIN),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
