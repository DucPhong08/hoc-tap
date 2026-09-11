import { Injectable } from '@nestjs/common';
import { BaseService } from '@/infra/services/base.service';
import { Role } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import { SystemRole } from '../enums/system-role.enum';

export const DEFAULT_ROLES = [SystemRole.ADMIN, SystemRole.USER];

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository, {
      notFoundMessage: 'Không tìm thấy role',
    });
  }

  async getAvailableRoleCodes(): Promise<string[]> {
    const dbRoles = await this.roleRepository.distinct('code');
    return Array.from(new Set([...DEFAULT_ROLES, ...dbRoles]));
  }
}
