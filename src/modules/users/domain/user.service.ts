import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRecord } from './user.model';
import { UserPolicy } from './user.policy';
import type { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    protected readonly userRepository: IUserRepository,
  ) {}

  async findAll(filter?: any, options?: any): Promise<User[]> {
    return this.userRepository.findAll(filter, options);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne(id);
  }

  async create(data: Partial<User>): Promise<User> {
    const userRecord = new UserRecord(
      data.record?.firstName || '',
      data.record?.lastName || '',
      data.record?.email || '',
    );

    if (!userRecord.isValidEmail()) {
      throw new BadRequestException('Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(
      userRecord.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    return this.userRepository.create(data);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (data.record?.email && data.record.email !== existingUser.record.email) {
      if (!UserPolicy.canUpdateEmail(existingUser, data.record.email)) {
        throw new BadRequestException(
          'Email can only be updated once per week',
        );
      }
    }

    return this.userRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (!user.canBeDeleted()) {
      throw new BadRequestException('User can only be deleted after 30 days');
    }

    await this.userRepository.remove(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
