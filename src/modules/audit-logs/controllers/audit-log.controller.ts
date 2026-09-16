import {
  Controller,
  Delete,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@/infra/controllers/base.controller';
import { Role } from '@/common/constants/role.constant';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogService } from '../services/audit-log.service';
import { AuditCleanupService } from '../services/audit-cleanup.service';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogController extends BaseController(
  AuditLog,
  undefined,
  undefined,
  undefined,
  {
    defaultRoles: [Role.ADMIN],
    routes: {
      create: { enabled: false },
      updateOne: { enabled: false },
      updateById: { enabled: false },
      updateByIds: { enabled: false },
      deleteOne: { enabled: false },
      deleteById: { enabled: false },
      deleteByIds: { enabled: false },
    },
  },
) {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly auditCleanupService: AuditCleanupService,
  ) {
    super(auditLogService);
  }

  @Delete('cleanup')
  @ApiQuery({
    name: 'days',
    required: true,
    type: Number,
  })
  async cleanup(
    @Query(
      'days',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    days: number,
  ): Promise<{ deleted: number }> {
    const deleted = await this.auditCleanupService.cleanup(days);
    return { deleted };
  }
}
