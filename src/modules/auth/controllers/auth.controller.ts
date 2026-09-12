import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { GoogleAuthGuard } from '@/common/guards/google-auth.guard';
import { FacebookAuthGuard } from '@/common/guards/facebook-auth.guard';
import type { Request } from 'express';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import {
  AuthUserProfile,
  OAuthProfile,
} from '../interfaces/oauth-profile.interface';
import { AuthResult, TokenPair } from '../types/auth-result.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResult> {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResult> {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<TokenPair> {
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('logout')
  @ApiBearerAuth()
  async logout(
    @ReqUser() user: User,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    return this.authService.logout(
      user.sessionId!,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('logout-all')
  @ApiBearerAuth()
  async logoutAll(
    @ReqUser() user: User,
    @Req() req: Request,
  ): Promise<{ success: boolean; revokedCount: number }> {
    return this.authService.logoutAll(
      user.id,
      undefined,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('me')
  @ApiBearerAuth()
  async me(@ReqUser('id') userId: string): Promise<AuthUserProfile> {
    return this.authService.getUser(userId);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request): Promise<AuthResult> {
    return this.authService.validateOAuthUser(
      req.user as OAuthProfile,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: Request): Promise<AuthResult> {
    return this.authService.validateOAuthUser(
      req.user as OAuthProfile,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
