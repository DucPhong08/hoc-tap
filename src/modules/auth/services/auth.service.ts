import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Optional,
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
import { AuditLogService } from '@/modules/audit-logs/services/audit-log.service';
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
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  // Đăng ký tài khoản mới bằng email và mật khẩu
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

    const { tokens } = await this.sessionService.create(
      user,
      ipAddress,
      userAgent,
    );

    this.emitAuditLog({
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      description: 'Đăng ký tài khoản mới thành công',
    });

    return { ...tokens, user: this.formatUser(user) };
  }

  // Đăng nhập tài khoản, kiểm tra khóa tài khoản và sinh phiên
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const user = await this.userService.getOne(SYSTEM_USER, {
      email: email.toLowerCase().trim(),
    });

    // Tránh user enumeration: luôn trả lỗi chung nếu không tìm thấy hoặc sai provider
    if (!user?.password || user.provider !== AuthProvider.LOCAL) {
      this.emitFailedLoginLog(email, ipAddress, userAgent);
      throw new UnauthorizedException('error-invalid-credentials');
    }

    // Kiểm tra nếu tài khoản đang bị tạm khóa
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
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

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password,
    );

    // Xử lý đếm số lần sai mật khẩu để khóa 15 phút nếu sai quá 5 lần
    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updatePayload: Partial<User> = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userService.updateById(SYSTEM_USER, user.id, updatePayload);
      this.emitFailedLoginLog(email, ipAddress, userAgent, user.id);
      throw new UnauthorizedException('error-invalid-credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('error-user-disabled');
    }

    // Reset bộ đếm số lần đăng nhập sai khi thành công
    if ((user.failedLoginAttempts ?? 0) > 0 || user.lockedUntil) {
      await this.userService.updateById(SYSTEM_USER, user.id, {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      });
    }

    const { tokens } = await this.sessionService.create(
      user,
      ipAddress,
      userAgent,
    );

    this.emitAuditLog({
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      description: 'Đăng nhập thành công',
    });

    return { ...tokens, user: this.formatUser(user) };
  }

  // Làm mới access token từ refresh token
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    return this.sessionService.rotate(refreshToken, ipAddress, userAgent);
  }

  // Đăng xuất phiên hiện tại
  async logout(
    sessionId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    await this.sessionService.revoke(sessionId);

    this.emitAuditLog({
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

  // Đăng xuất khỏi toàn bộ các thiết bị
  async logoutAll(
    userId: string,
    currentSessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; revokedCount: number }> {
    const count = await this.sessionService.revokeAll(userId, currentSessionId);

    this.emitAuditLog({
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

  // Lấy thông tin người dùng từ id
  async getUser(userId: string): Promise<AuthUserProfile> {
    const user = await this.userService.getById(SYSTEM_USER, userId);

    if (!user) {
      throw new UnauthorizedException('error-user-not-found');
    }

    return this.formatUser(user);
  }

  // Đăng nhập hoặc tạo mới người dùng qua OAuth (Google/Facebook)
  async validateOAuthUser(
    profile: OAuthProfile,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const emailNorm = profile.email.toLowerCase().trim();
    let user = await this.userService.getOne(SYSTEM_USER, { email: emailNorm });

    if (user) {
      user = (await this.userService.updateById(SYSTEM_USER, user.id, {
        provider: profile.provider,
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

  // Chuẩn hóa dữ liệu user trả về client
  formatUser(user: User): AuthUserProfile {
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

  // Đẩy audit log fire-and-forget
  private emitAuditLog(data: Parameters<AuditLogService['log']>[0]): void {
    if (!this.auditLogService) return;
    void this.auditLogService
      .log(data)
      .catch((err: Error) =>
        this.logger.error(`Lỗi audit log: ${err.message}`),
      );
  }

  // Ghi log đăng nhập thất bại
  private emitFailedLoginLog(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
  ): void {
    this.emitAuditLog({
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
