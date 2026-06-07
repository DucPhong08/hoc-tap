import { EntityManager } from '@mikro-orm/core';
import { Injectable, Optional } from '@nestjs/common';
import { ApiError } from '../../../common/exceptions/api-error';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { User } from '../entities/user.entity';
import { UserPolicy } from '../policies/user.policy';
import { UserRepository } from '../repositories/user.repository';
import type {
  DeleteCommand,
  CommandOptions,
  QueryOptions,
} from '../../../common/interfaces/repository.interface';
import type { BaseTransaction } from '../../../infra/transaction/base-transaction.interface';
import { InjectTransaction } from '../../../infra/transaction/transaction.provider';

@Injectable()
export class UserService extends BaseCrudService<User, EntityManager> {
  constructor(
    private readonly userRepository: UserRepository,
    @Optional()
    @InjectTransaction()
    transaction?: BaseTransaction<EntityManager>,
  ) {
    super(userRepository, { transaction });
  }

  async create(
    user: User | null,
    data: Partial<User>,
    query?: CommandOptions<EntityManager, User>,
  ): Promise<User> {
    return this.executeWithTransaction(query, async (txOptions) => {
      if (data.email) {
        const existingUser = await this.userRepository.findByEmail(
          data.email,
          txOptions,
        );

        if (existingUser) {
          throw ApiError.BadReq('error-user-exist');
        }
      }

      const userEntity = await super.create(user, data, txOptions);

      return userEntity;
    });
  }

  async updateById(
    user: User | null,
    id: string,
    data: Partial<User>,
    query?: CommandOptions<EntityManager, User>,
  ): Promise<User> {
    return this.executeWithTransaction(query, async (txOptions) => {
      const existingUser = await this.getByIdOrNull(user, id, txOptions);

      if (data.email) {
        if (existingUser && data.email !== existingUser.email) {
          if (!UserPolicy.canUpdateEmail(existingUser)) {
            throw ApiError.BadReq('error-email-update-limit');
          }
        }

        const emailExists = await this.userRepository.findByEmail(
          data.email,
          txOptions,
        );

        if (emailExists && emailExists.id !== existingUser?.id) {
          throw ApiError.BadReq('error-user-exist');
        }
      }

      return super.updateById(user, id, data, txOptions);
    });
  }

  async deleteById(
    user: User | null,
    id: string,
    query?: DeleteCommand & CommandOptions<EntityManager, User>,
  ): Promise<User> {
    return this.executeWithTransaction(query, async (txOptions) => {
      const userEntity = await this.getById(user, id, txOptions);

      if (!UserPolicy.canDelete(userEntity)) {
        throw ApiError.BadReq('error-user-delete-limit');
      }

      return super.deleteById(user, id, txOptions);
    });
  }

  async findByEmail(
    email: string,
    query?: QueryOptions<EntityManager>,
  ): Promise<User | null> {
    return this.userRepository.findByEmail(email, query);
  }
}
