import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BaseService } from '@/infra/services/base.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import type { FindQuery } from '@/common/interfaces/repository.interface';
import type { BaseTransaction } from '@/infra/transaction/base-transaction.interface';
import { InjectTransaction } from '@/infra/transaction/transaction.provider';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';
import type { AuthConfig } from '@/config/configuration';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectTransaction()
    transaction: BaseTransaction<EntityManager>,
    private readonly configService: ConfigService,
  ) {
    super(userRepository, { transaction });
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds =
      this.configService.get<AuthConfig>('auth')?.bcryptRounds ?? 10;
    return bcrypt.hash(password, rounds);
  }

  private formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private async checkUniqueEmail(
    email: string,
    txOptions?: FindQuery<User, EntityManager>,
    currentEmail?: string,
  ): Promise<void> {
    if (currentEmail && email === currentEmail) {
      return;
    }

    const emailExists = await this.userRepository.exists({ email }, txOptions);

    if (emailExists) {
      throw new BadRequestException('error-user-exist');
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
        payload.email = this.formatEmail(payload.email);
        await this.checkUniqueEmail(payload.email, txOptions);
      }

      if (payload.password) {
        payload.password = await this.hashPassword(payload.password);
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
        payload.email = this.formatEmail(payload.email);
        await this.checkUniqueEmail(
          payload.email,
          txOptions,
          existingUser.email,
        );
      }

      if (payload.password) {
        payload.password = await this.hashPassword(payload.password);
      }

      return super.updateById(user, id, payload, txOptions);
    });
  }
}
