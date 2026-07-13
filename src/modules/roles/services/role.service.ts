import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { BaseCrudService } from '@/infra/services/base-crud.service';
import { Role } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import type { BaseTransaction } from '@/infra/transaction/base-transaction.interface';
import { InjectTransaction } from '@/infra/transaction/transaction.provider';
import { SystemRole } from '../enums/system-role.enum';

export const DEFAULT_ROLES = [SystemRole.ADMIN, SystemRole.USER];

@Injectable()
export class RoleService extends BaseCrudService<Role, EntityManager> {
  constructor(
    private readonly roleRepository: RoleRepository,
    @Optional()
    @InjectTransaction()
    transaction?: BaseTransaction<EntityManager>,
  ) {
    super(roleRepository, {
      transaction,
      notFoundMessage: 'Không tìm thấy role',
    });
  }

  async getAvailableRoleCodes(): Promise<string[]> {
    const dbRoles = await this.roleRepository.distinct('code');
    return Array.from(new Set([...DEFAULT_ROLES, ...dbRoles]));
  }
}
