import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';
import { Authorization } from '@/common/decorators/authorize.decorator';

@ApiTags('audit-logs')
@Controller('audit-logs')
@Authorization()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('recent')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecent(@Query('limit') limit?: number): Promise<AuditLog[]> {
    return this.auditLogService.getRecentActions(limit);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getUserActions(userId, limit);
  }

  @Get('entity/:entityType/:entityId')
  async getByEntity(
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
  async cleanup(@Query('days') days: number): Promise<{ deleted: number }> {
    const deleted = await this.auditLogService.cleanup(days);
    return { deleted };
  }
}
