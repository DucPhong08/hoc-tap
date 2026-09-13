import { Controller, Get, Param, Body, Put } from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { Auditable } from '@/common/decorators/auditable.decorator';
import { Setting } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';
import { Authorization } from '@/common/decorators/authorize.decorator';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import type { User } from '@/modules/users/entities/user.entity';
import { SettingKey } from '../enums/setting-key.enum';
import { UpdateSettingDto } from '../dto/update-setting.dto';

@ApiTags('settings')
@Controller('settings')
@Authorization()
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('key/:key')
  @ApiParam({
    name: 'key',
    enum: SettingKey,
  })
  async getByKey(@Param('key') key: SettingKey): Promise<Setting | null> {
    const setting = await this.settingService.getValue(key);
    if (!setting) return null;
    return { key, value: setting } as any;
  }

  @Put('key/:key/value')
  @ApiParam({
    name: 'key',
    enum: SettingKey,
  })
  @Auditable({
    action: AuditAction.UPDATE,
    description: 'Cập nhật giá trị cấu hình',
  })
  async updateByKey(
    @ReqUser() user: User,
    @Param('key') key: SettingKey,
    @Body() dto: UpdateSettingDto,
  ): Promise<Setting> {
    return this.settingService.setValue(user, key, dto.value as any);
  }
}
