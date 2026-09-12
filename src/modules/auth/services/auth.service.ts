import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Optional,
  Logger,
} from '@nestjs/common';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { User } from '@/modules/users/entities/user.entity';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import {
  AuthUserProfile,
  OAuthProfile,
} from '../interfaces/oauth-profile.interface';
import { AuthProvider } from '../enums/auth-provider.enum';
import { Role } from '@/common/enums/role.enum';
import { AuditLogService } from '@/modules/audit-logs/services/audit-log.service';
import { AuthResult, TokenPair } from '../types/auth-result.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
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
    const emailNorm = email.toLowerCase().trim();

    if (!password || password.length < 8) {
      throw new BadRequestException('error-password-too-short');
    }

    const emailExists = await this.userRepository.exists({ email: emailNorm });
    if (emailExists) {
      throw new BadRequestException('error-user-exist');
    }

    const hashedPassword = await this.passwordService.hash(password);

    const user = await this.userRepository.create({
      email: emailNorm,
      password: hashedPassword,
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

    if (this.auditLogService) {
      void this.auditLogService
        .log({
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          userEmail: user.email,
          ipAddress,
          userAgent,
          description: 'Đăng ký tài khoản mới thành công',
        })
        .catch((err) => this.logger.error(`Lỗi audit log: ${err.message}`));
    }

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  // Đăng nhập tài khoản, kiểm tra khóa tài khoản và sinh phiên
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const emailNorm = email.toLowerCase().trim();
    const user = await this.userRepository.getOne({ email: emailNorm });

    // Tránh user enumeration: luôn trả lỗi chung nếu không tìm thấy hoặc sai provider
    if (!user?.password || user.provider !== AuthProvider.LOCAL) {
      this.logFailedLogin(emailNorm, ipAddress, userAgent);
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
      await this.userRepository.updateById(user.id, updatePayload);
      this.logFailedLogin(emailNorm, ipAddress, userAgent, user.id);
      throw new UnauthorizedException('error-invalid-credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('error-user-disabled');
    }

    // Reset bộ đếm số lần đăng nhập sai khi thành công
    if ((user.failedLoginAttempts ?? 0) > 0 || user.lockedUntil) {
      await this.userRepository.updateById(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      });
    }

    const { tokens } = await this.sessionService.create(
      user,
      ipAddress,
      userAgent,
    );

    if (this.auditLogService) {
      void this.auditLogService
        .log({
          action: 'LOGIN_SUCCESS',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          userEmail: user.email,
          ipAddress,
          userAgent,
          description: 'Đăng nhập thành công',
        })
        .catch((err) => this.logger.error(`Lỗi audit log: ${err.message}`));
    }

    return {
      ...tokens,
      user: this.formatUser(user),
    };
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

    if (this.auditLogService) {
      void this.auditLogService
        .log({
          action: 'LOGOUT',
          entityType: 'Session',
          entityId: sessionId,
          userId,
          ipAddress,
          userAgent,
          description: 'Đăng xuất và hủy phiên làm việc',
        })
        .catch((err) => this.logger.error(`Lỗi audit log: ${err.message}`));
    }

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

    if (this.auditLogService) {
      void this.auditLogService
        .log({
          action: 'ALL_SESSIONS_REVOKED',
          entityType: 'User',
          entityId: userId,
          userId,
          ipAddress,
          userAgent,
          description: `Đã hủy toàn bộ phiên làm việc (số lượng: ${count})`,
        })
        .catch((err) => this.logger.error(`Lỗi audit log: ${err.message}`));
    }

    return { success: true, revokedCount: count };
  }

  // Lấy thông tin người dùng từ id
  async getUser(userId: string): Promise<AuthUserProfile> {
    const user = await this.userRepository.getById(userId);

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
    let user = await this.userRepository.getOne({ email: emailNorm });

    if (user) {
      user = (await this.userRepository.updateById(user.id, {
        provider: profile.provider,
        avatar: profile.avatar,
      }))!;
    } else {
      user = await this.userRepository.create({
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

    return {
      ...tokens,
      user: this.formatUser(user),
    };
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

  // Ghi log đăng nhập thất bại
  private logFailedLogin(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
  ): void {
    if (this.auditLogService) {
      void this.auditLogService
        .log({
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: userId ?? 'unknown',
          userId: userId ?? 'unknown',
          userEmail: email,
          ipAddress,
          userAgent,
          description: 'Đăng nhập thất bại: thông tin xác thực không đúng',
        })
        .catch((err) => this.logger.error(`Lỗi audit log: ${err.message}`));
    }
  }
}
