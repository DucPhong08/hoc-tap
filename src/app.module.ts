import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MikroOrmDatabaseModule } from './database/mikro-orm.module';
import { CacheModule } from './infra/cache/cache.module';
import { MonitoringModule } from './infra/monitoring/monitoring.module';
import { WebsocketModule } from './infra/websocket/websocket.module';
import { CronModule } from './infra/cron/cron.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { RolesModule } from './modules/roles/roles.module';
// PLOP: IMPORT_MODULE

import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      ignoreEnvFile: false,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('cache.redis.host', 'localhost'),
          port: configService.get<number>('cache.redis.port', 6379),
          password:
            configService.get<string>('cache.redis.password') || undefined,
          db: configService.get<number>('cache.redis.db', 0),
        },
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, '/common/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-custom-lang']),
        AcceptLanguageResolver,
      ],
    }),
    MikroOrmDatabaseModule,
    CacheModule,
    MonitoringModule,
    WebsocketModule,
    CronModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    AuditLogsModule,
    RolesModule,
    // PLOP: IMPORT_ARRAY
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '{*path}',
      method: RequestMethod.ALL,
    });
  }
}
