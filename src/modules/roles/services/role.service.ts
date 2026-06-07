import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { Role } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import type { BaseTransaction } from '../../../infra/transaction/base-transaction.interface';
import { InjectTransaction } from '../../../infra/transaction/transaction.provider';

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
}
