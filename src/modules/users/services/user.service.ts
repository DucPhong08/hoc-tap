import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseCrudService } from '../../../infra/services/base-crud.service';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UserPolicy } from './user.policy';
import type { UserContext } from '../../../common/types/user.type';

@Injectable()
export class UserService extends BaseCrudService<UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository, {
      entityName: 'Người dùng',
      notFoundMessage: 'Không tìm thấy người dùng',
    });
  }

  async create(
    user: UserContext,
    data: Partial<UserEntity>,
  ): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    return super.create(user, data);
  }

  async updateById(
    user: UserContext,
    id: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.getById(user, id);
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

    return super.updateById(user, id, data);
  }

  async deleteById(user: UserContext, id: string): Promise<UserEntity> {
    const userEntity = await this.getById(user, id);

    if (!UserPolicy.canDelete(userEntity)) {
      throw new BadRequestException('Người dùng chỉ có thể xóa sau 30 ngày');
    }

    return super.deleteById(user, id);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }
}
