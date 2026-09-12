import { Controller, Get, Param, Body, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auditable } from '@/common/decorators/auditable.decorator';
import { Setting } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';
import { Authorization } from '@/common/decorators/authorize.decorator';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import type { User } from '@/modules/users/entities/user.entity';

@ApiTags('settings')
@Controller('settings')
@Authorization()
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('key/:key')
  async getByKey(@Param('key') key: string): Promise<Setting | null> {
    const setting = await this.settingService.getValue(key as any);
    if (!setting) return null;
    return { key, value: setting } as any;
  }

  @Put('key/:key/value')
  @Auditable({
    action: AuditAction.UPDATE,
    description: 'Cập nhật giá trị cấu hình',
  })
  async updateByKey(
    @ReqUser() user: User,
    @Param('key') key: string,
    @Body('value') value: any,
  ): Promise<Setting> {
    return this.settingService.setValue(user, key as any, value);
  }
}
