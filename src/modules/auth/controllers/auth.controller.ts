import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Public } from '@/common/decorators/public.decorator';
import { GoogleAuthGuard } from '@/common/guards/google-auth.guard';
import { FacebookAuthGuard } from '@/common/guards/facebook-auth.guard';
import type { Request } from 'express';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import {
  AuthUserProfile,
  LoginResponse,
} from '../interfaces/oauth-profile.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponse> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
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
  async googleAuthCallback(@Req() req: Request): Promise<LoginResponse> {
    return this.authService.generateTokens(req.user as User);
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: Request): Promise<LoginResponse> {
    return this.authService.generateTokens(req.user as User);
  }
}
