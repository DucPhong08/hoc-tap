import { EntityManager } from '@mikro-orm/core';
import { Injectable, Optional } from '@nestjs/common';
import { ApiError } from '@/common/exceptions/api-error';
import { BaseCrudService } from '@/infra/services/base-crud.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import type { FindQuery } from '@/common/interfaces/repository.interface';
import type { BaseTransaction } from '@/infra/transaction/base-transaction.interface';
import { InjectTransaction } from '@/infra/transaction/transaction.provider';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

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

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private async assertEmailUnique(
    email: string,
    txOptions?: FindQuery<User, EntityManager>,
    currentEmail?: string,
  ): Promise<void> {
    if (currentEmail && email === currentEmail) {
      return;
    }

    const emailExists = await this.userRepository.exists({ email }, txOptions);

    if (emailExists) {
      throw ApiError.BadReq('error-user-exist');
    }
  }

  async create(
    user: IAuthUser,
    data: Partial<User>,
    query?: FindQuery<User, EntityManager>,
  ): Promise<User> {
    return this.executeWithTransaction(query, async (txOptions) => {
      const payload = { ...data };

      if (payload.email) {
        payload.email = this.normalizeEmail(payload.email);
        await this.assertEmailUnique(payload.email, txOptions);
      }

      return super.create(user, payload, txOptions);
    });
  }

  async updateById(
    user: IAuthUser,
    id: string,
    data: Partial<User>,
    query?: FindQuery<User, EntityManager>,
  ): Promise<User | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      const existingUser = await this.getById(user, id, txOptions);
      if (!existingUser) {
        return null;
      }

      const payload = { ...data };

      if (payload.email) {
        payload.email = this.normalizeEmail(payload.email);
        await this.assertEmailUnique(
          payload.email,
          txOptions,
          existingUser.email,
        );
      }

      return super.updateById(user, id, payload, txOptions);
    });
  }
}
