import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmConfigService } from './mikro-orm-config.service';
import { MigrationService } from './migration.service';
import { RootConfig } from '../config/root.config';
import { MainEntities } from '../modules/database/entities/main.entities';
import { DB_CONTEXTS } from 'src/modules/database/constants';

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
          entities: MainEntities,
        };
      },
      contextName: DB_CONTEXTS.MAIN,
    }),
    MikroOrmModule.forFeature({
      entities: MainEntities,
      contextName: DB_CONTEXTS.MAIN,
    }),
  ],
  providers: [MigrationService],
  exports: [MikroOrmModule],
})
export class OrmMikroModule {}
