import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmConfigService } from './mikro-orm-config.service';
import { RootConfig } from '../config/root.config';

@Module({})
export class OrmModule {
  static register(contextName: string = 'main'): DynamicModule {
    return {
      module: OrmModule,
      imports: [
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService<RootConfig>) => {
            const ormConfigService = new MikroOrmConfigService(configService);
            return ormConfigService.createMikroOrmOptions(contextName);
          },
          contextName,
        }),
      ],
    };
  }
}
