import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import loader from './config/loader';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SettingsModule } from './infra/settings/settings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransactionModule } from './infra/transaction/transaction.module';
import { OrmMikroModule } from './infra/database/orm-mikro.module';
import { CacheModule } from './infra/cache/cache.module';
import { LoggingModule } from './common/logging/logging.module';
import { MonitoringModule } from './infra/monitoring/monitoring.module';
import { WebsocketModule } from './infra/websocket/websocket.module';
import { CronModule } from './infra/cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loader],
      ignoreEnvFile: false,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    OrmMikroModule,
    TransactionModule,
    CacheModule,
    LoggingModule,
    MonitoringModule,
    WebsocketModule,
    CronModule,
    AuthModule.forRoot(),
    UsersModule,
    SettingsModule,
    AuditLogsModule,
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
export class AppModule {}
