import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('audit-logs')
@Controller('audit-logs')
@Roles('admin')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get recent audit logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [AuditLogEntity] })
  async getRecentLogs(
    @Query('limit') limit?: number,
  ): Promise<AuditLogEntity[]> {
    return this.auditLogService.getRecentActions(limit || 50);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [AuditLogEntity] })
  async getUserLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLogEntity[]> {
    return this.auditLogService.getUserActions(userId, limit);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get complete history of an entity' })
  @ApiResponse({ status: 200, type: [AuditLogEntity] })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLogEntity[]> {
    return this.auditLogService.getEntityHistory(entityType, entityId);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup old audit logs' })
  @ApiQuery({
    name: 'days',
    required: true,
    type: Number,
    description: 'Delete logs older than N days',
  })
  @ApiResponse({ status: 200, description: 'Number of deleted logs' })
  async cleanupOldLogs(
    @Query('days') days: number,
  ): Promise<{ deleted: number }> {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - days);
    const deleted = await this.auditLogService.cleanupOldLogs(days);
    return { deleted };
  }
}
