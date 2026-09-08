import { EntityManager } from '@mikro-orm/core';
import { Injectable, Optional } from '@nestjs/common';
import { ApiError } from '@/common/exceptions/api-error';
import { BaseCrudService } from '@/infra/services/base-crud.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import type { FindQuery } from '@/common/interfaces/repository.interface';
import type { BaseTransaction } from '@/infra/transaction/base-transaction.interface';
import { InjectTransaction } from '@/infra/transaction/transaction.provider';

@Injectable()
export class UserService extends BaseCrudService<User> {
  constructor(
    private readonly userRepository: UserRepository,
    @Optional()
    @InjectTransaction()
    transaction?: BaseTransaction<EntityManager>,
  ) {
    super(userRepository, { transaction });
  }

  async create(
    user: User,
    data: Partial<User>,
    query?: FindQuery<User, EntityManager>,
  ): Promise<User> {
    return this.executeWithTransaction(query, async (txOptions) => {
      if (data.email) {
        data.email = data.email.toLowerCase().trim();
        const emailExists = await this.userRepository.exists(
          { email: data.email },
          txOptions,
        );

        if (emailExists) {
          throw ApiError.BadReq('error-user-exist');
        }
      }

      return super.create(user, data, txOptions);
    });
  }

  async updateById(
    user: User,
    id: string,
    data: Partial<User>,
    query?: FindQuery<User, EntityManager>,
  ): Promise<User | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      const existingUser = await this.getById(user, id, txOptions);
      if (!existingUser) return null;

      if (data.email) {
        data.email = data.email.toLowerCase().trim();
        if (data.email !== existingUser.email) {
          const emailExists = await this.userRepository.exists(
            { email: data.email },
            txOptions,
          );

          if (emailExists) {
            throw ApiError.BadReq('error-user-exist');
          }
        }
      }

      return super.updateById(user, id, data, txOptions);
    });
  }
}
