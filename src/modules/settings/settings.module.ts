import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { SettingRepository } from './repositories/setting.repository';
import { SettingEntity } from './entities/setting.entity';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { TransactionModule } from '../../infra/transaction/transaction.module';

@Module({
  imports: [
    TransactionModule,
    MikroOrmModule.forFeature({
      entities: [SettingEntity],
      contextName: DB_CONTEXTS.MAIN,
    }),
  ],
  controllers: [SettingController],
  providers: [SettingService, SettingRepository],
  exports: [SettingService],
})
export class SettingsModule {}
