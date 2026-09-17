import { Module } from '@nestjs/common';
import { Entity } from '@/common/enums/entity.enum';
import { RepositoryProvider } from '@/infra/repositories/common/repository';
import { SettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { SettingRepository } from './repositories/setting.repository';

@Module({
  controllers: [SettingController],
  providers: [
    RepositoryProvider(Entity.SETTING, SettingRepository),
    SettingService,
  ],
  exports: [SettingService],
})
export class SettingsModule {}
