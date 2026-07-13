import { Module } from '@nestjs/common';
import { RoleRepository } from './repositories/role.repository';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';
import { registerEntities } from '@/database/entity-registry.helper';
import { Role } from './entities/role.entity';

@Module({
  imports: [...registerEntities([Role])],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
})
export class RolesModule {}
