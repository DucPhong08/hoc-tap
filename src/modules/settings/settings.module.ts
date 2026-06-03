import { Module } from '@nestjs/common';
import { SettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { SettingRepository } from './repositories/setting.repository';
import { TransactionModule } from '../../infra/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [SettingController],
  providers: [SettingService, SettingRepository],
  exports: [SettingService],
})
export class SettingsModule {}
