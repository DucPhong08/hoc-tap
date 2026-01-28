import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export const Authorization = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), ApiBearerAuth());
