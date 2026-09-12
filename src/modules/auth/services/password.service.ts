import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AuthConfig } from '@/config/configuration';

@Injectable()
export class PasswordService {
  private readonly rounds: number;

  constructor(private readonly configService: ConfigService) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const isProd = this.configService.get<string>('mode') === 'production';
    this.rounds = authConfig?.bcryptRounds ?? (isProd ? 12 : 10);
  }

  // Băm mật khẩu bằng bcrypt
  async hash(password: string): Promise<string> {
    if (!password) {
      throw new Error('Password must not be empty.');
    }
    return bcrypt.hash(password, this.rounds);
  }

  // Kiểm tra mật khẩu khớp với hash
  async compare(password: string, passwordHash: string): Promise<boolean> {
    if (!password || !passwordHash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      return false;
    }
  }
}
