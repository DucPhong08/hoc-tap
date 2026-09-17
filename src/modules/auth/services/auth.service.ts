import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UserService } from '@/modules/users/services/user.service';
import { User } from '@/modules/users/entities/user.entity';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import {
  AuthUserProfile,
  OAuthProfile,
} from '../interfaces/oauth-profile.interface';
import { AuthProvider } from '../enums/auth-provider.enum';
import { Role } from '@/common/constants/role.constant';
import { AuditLogQueueService } from '@/modules/audit-logs/services/audit-log-queue.service';
import { AuthResult, TokenPair } from '../types/auth-result.type';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

/** Token đại diện cho tác nhân hệ thống (không có user đăng nhập). */
const SYSTEM_USER: IAuthUser = {
  id: 'system',
  email: 'system@internal',
  roles: [Role.ADMIN],
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly auditLogQueueService: AuditLogQueueService,
  ) {}

  // ──────────────────────────────── Public API ────────────────────────────────

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!password || password.length < 8) {
      throw new BadRequestException('error-password-too-short');
    }

    // UserService.create() đã lo normalize email, check unique, hash password
    const user = await this.userService.create(SYSTEM_USER, {
      email,
      password,
      firstName,
      lastName,
      isActive: true,
      provider: AuthProvider.LOCAL,
      role: Role.USER,
    });

    const result = await this.createAuthSession(
      user,
      ipAddress,
      userAgent,
      'USER_REGISTERED',
      'Đăng ký tài khoản mới thành công',
    );
    return result;
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const user = await this.findLocalUser(email, ipAddress, userAgent);
    this.assertNotLocked(user);
    await this.verifyPasswordOrLock(
      user,
      password,
      email,
      ipAddress,
      userAgent,
    );
    this.assertActive(user);
    await this.resetFailedAttempts(user);

    return this.createAuthSession(
      user,
      ipAddress,
      userAgent,
      'LOGIN_SUCCESS',
      'Đăng nhập thành công',
    );
  }

  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    return this.sessionService.rotate(refreshToken, ipAddress, userAgent);
  }

  async logout(
    sessionId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    await this.sessionService.revoke(sessionId);

    this.dispatchAuditLog({
      action: 'LOGOUT',
      entityType: 'Session',
      entityId: sessionId,
      userId,
      ipAddress,
      userAgent,
      description: 'Đăng xuất và hủy phiên làm việc',
    });

    return { success: true };
  }

  async logoutAll(
    userId: string,
    currentSessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; revokedCount: number }> {
    const count = await this.sessionService.revokeAll(userId, currentSessionId);

    this.dispatchAuditLog({
      action: 'ALL_SESSIONS_REVOKED',
      entityType: 'User',
      entityId: userId,
      userId,
      ipAddress,
      userAgent,
      description: `Đã hủy toàn bộ phiên làm việc (số lượng: ${count})`,
    });

    return { success: true, revokedCount: count };
  }

  async getUser(userId: string): Promise<AuthUserProfile> {
    const user = await this.userService.getById(SYSTEM_USER, userId);

    if (!user) {
      throw new UnauthorizedException('error-user-not-found');
    }

    return this.formatUser(user);
  }

  async validateOAuthUser(
    profile: OAuthProfile,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!profile.email?.trim()) {
      throw new UnauthorizedException('error-invalid-credentials');
    }
    const emailNorm = profile.email.toLowerCase().trim();
    let user = await this.userService.getOne(SYSTEM_USER, { email: emailNorm });

    if (user) {
      this.assertActive(user);
      this.assertNotLocked(user);
      user = (await this.userService.updateById(SYSTEM_USER, user.id, {
        avatar: profile.avatar,
      }))!;
    } else {
      user = await this.userService.create(SYSTEM_USER, {
        email: emailNorm,
        firstName: profile.firstName,
        lastName: profile.lastName,
        provider: profile.provider,
        avatar: profile.avatar,
        isActive: true,
        role: Role.USER,
      });
    }

    const { tokens } = await this.sessionService.create(
      user,
      ipAddress,
      userAgent,
    );

    return { ...tokens, user: this.formatUser(user) };
  }

  // ──────────────────────── Login — Private Helpers ───────────────────────────

  /**
   * Tìm user local theo email.
   * Tránh user enumeration: trả lỗi chung nếu không tìm thấy hoặc sai provider.
   */
  private async findLocalUser(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User> {
    const user = await this.userService.getOne(SYSTEM_USER, {
      email: email.toLowerCase().trim(),
    });

    if (!user?.password || user.provider !== AuthProvider.LOCAL) {
      this.dispatchFailedLoginLog(email, ipAddress, userAgent);
      throw new UnauthorizedException('error-invalid-credentials');
    }

    return user;
  }

  /** Kiểm tra tài khoản có đang bị tạm khóa không. */
  private assertNotLocked(user: User): void {
    if (!user.lockedUntil || new Date(user.lockedUntil) <= new Date()) return;

    const remainingMinutes = Math.max(
      1,
      Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      ),
    );
    throw new UnauthorizedException(
      `error-account-locked-try-again-in-${remainingMinutes}-minutes`,
    );
  }

  /**
   * Verify password — nếu sai thì đếm failed attempts.
   * Khóa tài khoản 15 phút khi sai quá 5 lần.
   */
  private async verifyPasswordOrLock(
    user: User,
    password: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const isValid = await this.passwordService.compare(
      password,
      user.password!,
    );

    if (isValid) return;

    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updatePayload: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await this.userService.updateById(SYSTEM_USER, user.id, updatePayload);
    this.dispatchFailedLoginLog(email, ipAddress, userAgent, user.id);
    throw new UnauthorizedException('error-invalid-credentials');
  }

  /** Kiểm tra tài khoản có đang active không. */
  private assertActive(user: User): void {
    if (!user.isActive) {
      throw new UnauthorizedException('error-user-disabled');
    }
  }

  /** Reset bộ đếm failed attempts khi login thành công. */
  private async resetFailedAttempts(user: User): Promise<void> {
    if ((user.failedLoginAttempts ?? 0) > 0 || user.lockedUntil) {
      await this.userService.updateById(SYSTEM_USER, user.id, {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      });
    }
  }

  /** Tạo session mới + emit audit log + trả kết quả. */
  private async createAuthSession(
    user: User,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    action: string,
    description: string,
  ): Promise<AuthResult> {
    const { tokens } = await this.sessionService.create(
      user,
      ipAddress,
      userAgent,
    );

    this.dispatchAuditLog({
      action,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      description,
    });

    return { ...tokens, user: this.formatUser(user) };
  }

  // ──────────────────────────── Shared Helpers ────────────────────────────────

  /** Chuẩn hóa dữ liệu user trả về client. */
  private formatUser(user: User): AuthUserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      provider: user.provider ?? AuthProvider.LOCAL,
      avatar: user.avatar,
      isActive: user.isActive,
    };
  }

  /** Đẩy audit log qua queue (fire-and-forget). */
  private dispatchAuditLog(
    data: Parameters<AuditLogQueueService['dispatch']>[0],
  ): void {
    this.auditLogQueueService.dispatch(data);
  }

  private dispatchFailedLoginLog(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
  ): void {
    this.dispatchAuditLog({
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: userId ?? 'unknown',
      userId: userId ?? 'unknown',
      userEmail: email,
      ipAddress,
      userAgent,
      description: 'Đăng nhập thất bại: thông tin xác thực không đúng',
    });
  }
}
