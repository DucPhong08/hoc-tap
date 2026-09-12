import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import type { AuthConfig } from '@/config/configuration';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Tạo access token chứa userId và sessionId
  signAccess(userId: string, sessionId: string): string {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const payload: JwtPayload = {
      sub: userId,
      sessionId,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: authConfig?.jwtSecret ?? 'default-secret',
      expiresIn: (authConfig?.jwtExpiresIn ?? '15m') as StringValue,
      issuer: authConfig?.jwtIssuer ?? 'hoc-tap-auth',
      audience: authConfig?.jwtAudience ?? 'hoc-tap-client',
    });
  }

  // Tạo refresh token ngẫu nhiên và mã băm SHA-256
  generateRefresh(): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    return { rawToken, tokenHash };
  }

  // Băm token bằng SHA-256
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  // Xác thực access token và giải mã payload
  verifyAccess(token: string): JwtPayload {
    try {
      const authConfig = this.configService.get<AuthConfig>('auth');
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: authConfig?.jwtSecret ?? 'default-secret',
        issuer: authConfig?.jwtIssuer ?? 'hoc-tap-auth',
        audience: authConfig?.jwtAudience ?? 'hoc-tap-client',
      });

      if (
        !payload ||
        payload.type !== 'access' ||
        !payload.sub ||
        !payload.sessionId
      ) {
        throw new UnauthorizedException('error-invalid-token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('error-invalid-token');
    }
  }

  // Hạn dùng access token tính theo giây
  accessTtlSeconds(): number {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const exp = authConfig?.jwtExpiresIn ?? '15m';
    if (exp.endsWith('m')) return parseInt(exp, 10) * 60;
    if (exp.endsWith('h')) return parseInt(exp, 10) * 3600;
    if (exp.endsWith('d')) return parseInt(exp, 10) * 86400;
    if (exp.endsWith('s')) return parseInt(exp, 10);
    return 900;
  }

  // Hạn dùng refresh token tính theo mili-giây
  refreshTtlMs(): number {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const exp = authConfig?.jwtRefreshExpiresIn ?? '7d';
    if (exp.endsWith('d')) return parseInt(exp, 10) * 86400 * 1000;
    if (exp.endsWith('h')) return parseInt(exp, 10) * 3600 * 1000;
    if (exp.endsWith('m')) return parseInt(exp, 10) * 60 * 1000;
    return 7 * 86400 * 1000;
  }
}
