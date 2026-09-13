import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BaseService } from '@/infra/services/base.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import type { FindQuery } from '@/common/interfaces/repository.interface';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';
import type { AuthConfig } from '@/config/configuration';
import type { UpdateProfileDto } from '../dto/update-user.dto';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    super(userRepository);
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
    query?: FindQuery<User>,
    currentEmail?: string,
  ): Promise<void> {
    if (currentEmail && email === currentEmail) {
      return;
    }

    const emailExists = await this.userRepository.exists({ email }, query);

    if (emailExists) {
      throw new BadRequestException('error-user-exist');
    }
  }

  async create(
    user: IAuthUser,
    data: Partial<User>,
    query?: FindQuery<User>,
  ): Promise<User> {
    const payload = { ...data };

    if (payload.email) {
      payload.email = this.formatEmail(payload.email);
      await this.checkUniqueEmail(payload.email, query);
    }

    if (payload.password) {
      payload.password = await this.hashPassword(payload.password);
    }

    return super.create(user, payload, query);
  }

  async updateById(
    user: IAuthUser,
    id: string,
    data: Partial<User>,
    query?: FindQuery<User>,
  ): Promise<User | null> {
    const existingUser = await this.getById(user, id, query);
    if (!existingUser) {
      return null;
    }

    const payload = { ...data };

    if (payload.email) {
      payload.email = this.formatEmail(payload.email);
      await this.checkUniqueEmail(payload.email, query, existingUser.email);
    }

    if (payload.password) {
      payload.password = await this.hashPassword(payload.password);
    }

    return super.updateById(user, id, payload, query);
  }

  async updateProfile(
    user: IAuthUser,
    dto: UpdateProfileDto,
  ): Promise<User | null> {
    if (!user.id) {
      throw new BadRequestException('error-invalid-user-id');
    }

    const payload: Partial<User> = {};
    if (dto.firstName !== undefined) payload.firstName = dto.firstName;
    if (dto.lastName !== undefined) payload.lastName = dto.lastName;
    if (dto.avatar !== undefined) payload.avatar = dto.avatar;

    return super.updateById(user, user.id, payload);
  }
}
