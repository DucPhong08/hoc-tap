import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogService } from './services/audit-log.service';
import { AuditCleanupService } from './services/audit-cleanup.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { DB_CONTEXTS } from 'src/database/database.constants';

@Global()
@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [AuditLogEntity],
      contextName: DB_CONTEXTS.MAIN,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogService,
    AuditCleanupService,
    AuditInterceptor,
  ],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditLogsModule {}
