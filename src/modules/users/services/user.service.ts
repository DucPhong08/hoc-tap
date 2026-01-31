import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseCrudService } from '../../../common/services/base-crud.service';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UserPolicy } from './user.policy';

@Injectable()
export class UserService extends BaseCrudService<UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository, {
      notFoundCode: 'USER_NOT_FOUND',
    });
  }

  async create(user: any, data: Partial<UserEntity>): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    return super.create(user, data);
  }

  async updateById(
    user: any,
    id: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    if (data.email) {
      const existingUser = await this.getById(user, id);
      if (existingUser && data.email !== existingUser.email) {
        if (!UserPolicy.canUpdateEmail(existingUser)) {
          throw new BadRequestException(
            'Email can only be updated once per week',
          );
        }

        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) {
          throw new BadRequestException('Email already exists');
        }
      }
    }

    return super.updateById(user, id, data);
  }

  async deleteById(user: any, id: string): Promise<UserEntity | null> {
    const userEntity = await this.getById(user, id);
    if (!userEntity) {
      return null;
    }

    if (!UserPolicy.canDelete(userEntity)) {
      throw new BadRequestException('User can only be deleted after 30 days');
    }

    await super.deleteById(user, id);
    return userEntity;
  }

  async findByEmail(user: any, email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }
}
