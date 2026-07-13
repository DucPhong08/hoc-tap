import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';

@ApiTags('audit-logs')
@Controller('audit-logs')
@Roles(SystemRole.ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('recent')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentLogs(@Query('limit') limit?: number): Promise<AuditLog[]> {
    return this.auditLogService.getRecentActions(limit || 50);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getUserActions(userId, limit);
  }

  @Get('entity/:entityType/:entityId')
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getEntityHistory(entityType, entityId);
  }

  @Delete('cleanup')
  @ApiQuery({
    name: 'days',
    required: true,
    type: Number,
  })
  async cleanupOldLogs(
    @Query('days') days: number,
  ): Promise<{ deleted: number }> {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - days);
    const deleted = await this.auditLogService.cleanupOldLogs(days);
    return { deleted };
  }
}
