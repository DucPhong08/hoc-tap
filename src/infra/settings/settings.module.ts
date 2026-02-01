import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { SettingRepository } from './repositories/setting.repository';
import { SettingEntity } from './entities/setting.entity';

@Module({
  imports: [MikroOrmModule.forFeature([SettingEntity])],
  controllers: [SettingController],
  providers: [SettingService, SettingRepository],
  exports: [SettingService],
})
export class SettingsModule {}
