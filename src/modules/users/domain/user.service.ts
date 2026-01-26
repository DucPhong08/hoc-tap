import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseCrudService } from '../../../common/services/base-crud.service';
import { UserEntity } from '../repository/entities/user.entity';
import { UserRepository } from '../repository/user.repository';
import { UserPolicy } from './user.policy';

@Injectable()
export class UserService extends BaseCrudService<UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    return super.create(data);
  }

  async updateById(
    id: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    if (data.email) {
      const existingUser = await this.findById(id);
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

    return super.updateById(id, data);
  }

  async deleteById(id: string): Promise<UserEntity | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    if (!UserPolicy.canDelete(user)) {
      throw new BadRequestException('User can only be deleted after 30 days');
    }

    await super.deleteById(id);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }
}
