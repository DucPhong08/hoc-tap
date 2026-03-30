import { Controller, Get, Param, Body, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auditable } from '../../../common/decorators/auditable.decorator';
import { SettingEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';
import { Authorization } from 'src/common/decorators/authorization.decorator';
import { AuditAction } from '../../audit-logs/enums/audit-action.enum';

@ApiTags('settings')
@Controller('settings')
@Authorization()
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('key/:key')
  async getByKey(@Param('key') key: string): Promise<SettingEntity | null> {
    const setting = await this.settingService.getSettingValue(key as any);
    if (!setting) return null;
    return { key, value: setting } as any;
  }

  @Put('key/:key/value')
  @Auditable({
    action: AuditAction.UPDATE,
    description: 'Update setting value',
  })
  async updateValueByKey(
    @Param('key') key: string,
    @Body('value') value: any,
  ): Promise<SettingEntity> {
    return this.settingService.setSettingValue(key as any, value);
  }
}
