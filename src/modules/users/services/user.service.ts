import { EntityManager } from '@mikro-orm/core';
import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { UserEntity } from '../entities/user.entity';
import { UserPolicy } from '../policies/user.policy';
import { UserRepository } from '../repositories/user.repository';
import type {
  DeleteCommand,
  CommandOptions,
  QueryOptions,
} from '../../../common/interfaces/repository.interface';
import type { AuthProvider } from '../../auth/enums/auth-provider.enum';
import type { BaseTransaction } from '../../../infra/transaction/base-transaction.interface';
import { InjectTransaction } from '../../../infra/transaction/transaction.provider';

@Injectable()
export class UserService extends BaseCrudService<UserEntity, EntityManager> {
  constructor(
    private readonly userRepository: UserRepository,
    @Optional()
    @InjectTransaction()
    transaction?: BaseTransaction<EntityManager>,
  ) {
    super(userRepository, { transaction });
  }

  async create(
    data: Partial<UserEntity>,
    options?: CommandOptions<EntityManager>,
  ): Promise<UserEntity> {
    return this.executeWithTransaction(options, async (txOptions) => {
      if (data.email) {
        const existingUser = await this.userRepository.findByEmail(
          data.email,
          txOptions,
        );

        if (existingUser) {
          throw new BadRequestException('Email đã tồn tại');
        }
      }

      return super.create(data, txOptions);
    });
  }

  async updateById(
    id: string,
    data: Partial<UserEntity>,
    options?: CommandOptions<EntityManager>,
  ): Promise<UserEntity> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const existingUser = await this.getByIdOrNull(id, txOptions);

      if (data.email) {
        if (existingUser && data.email !== existingUser.email) {
          if (!UserPolicy.canUpdateEmail(existingUser)) {
            throw new BadRequestException(
              'Email chỉ có thể cập nhật một lần mỗi tuần',
            );
          }
        }

        const emailExists = await this.userRepository.findByEmail(
          data.email,
          txOptions,
        );

        if (emailExists && emailExists.id !== existingUser?.id) {
          throw new BadRequestException('Email đã tồn tại');
        }
      }

      return super.updateById(id, data, txOptions);
    });
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<EntityManager>,
  ): Promise<UserEntity> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const userEntity = await this.getById(id, txOptions);

      if (!UserPolicy.canDelete(userEntity)) {
        throw new BadRequestException('Người dùng chỉ có thể xóa sau 30 ngày');
      }

      return super.deleteById(id, txOptions);
    });
  }

  async findByEmail(
    email: string,
    options?: QueryOptions<EntityManager>,
  ): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email, options);
  }

  async findByProviderAccount(
    provider: AuthProvider,
    providerId: string,
  ): Promise<UserEntity | null> {
    return this.userRepository.getOne({
      provider,
      providerId,
    });
  }
}
