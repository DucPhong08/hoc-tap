import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  DB_CONTEXTS,
  getEntitiesByContext,
} from 'src/config/database/entities.config';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature(getEntitiesByContext(DB_CONTEXTS.MAIN))],
  exports: [MikroOrmModule],
})
export class OrmFeatureModule {}
