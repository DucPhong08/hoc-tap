import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { UserEntity } from '../entities/user.entity';
import { UserPolicy } from '../policies/user.policy';
import { UserRepository } from '../repositories/user.repository';
import type {
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  CommandOptions,
} from '../../../common/interfaces/repository.interface';
import type { AuthProvider } from '../../auth/enums/auth-provider.enum';

@Injectable()
export class UserService extends BaseCrudService<UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository, {});
  }

  async create(
    data: Partial<UserEntity>,
    options?: CreateCommand & CommandOptions,
  ): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    return super.create(data, options);
  }

  async updateById(
    id: string,
    data: Partial<UserEntity>,
    options?: UpdateCommand & CommandOptions,
  ): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.getById(id);
      if (data.email !== existingUser.email) {
        if (!UserPolicy.canUpdateEmail(existingUser)) {
          throw new BadRequestException(
            'Email chỉ có thể cập nhật một lần mỗi tuần',
          );
        }

        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) {
          throw new BadRequestException('Email đã tồn tại');
        }
      }
    }

    return super.updateById(id, data, options);
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions,
  ): Promise<UserEntity> {
    const userEntity = await this.getById(id);

    if (!UserPolicy.canDelete(userEntity)) {
      throw new BadRequestException('Người dùng chỉ có thể xóa sau 30 ngày');
    }

    return super.deleteById(id, options);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
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
