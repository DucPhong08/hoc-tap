import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';
import { Authorization } from 'src/common/decorators/authorization.decorator';

@ApiTags('settings')
@Controller('settings')
@Authorization()
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('key/:key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiResponse({ status: 200, type: SettingEntity })
  async getByKey(@Param('key') key: string): Promise<SettingEntity | null> {
    const setting = await this.settingService.getSettingValue(key as any);
    if (!setting) return null;
    return { key, value: setting } as any;
  }

  @Patch('key/:key/value')
  @ApiOperation({ summary: 'Update setting value by key' })
  @ApiResponse({ status: 200, type: SettingEntity })
  async updateValueByKey(
    @Param('key') key: string,
    @Body('value') value: any,
  ): Promise<SettingEntity> {
    return this.settingService.setSettingValue(key as any, value);
  }
}
