import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

export class ApiError {
  static badRequest(messageKey: string) {
    return new BadRequestException(messageKey);
  }

  static badReq(messageKey: string) {
    return this.badRequest(messageKey);
  }

  static conflict(messageKey: string) {
    return new ConflictException(messageKey);
  }

  static forbidden(messageKey: string) {
    return new ForbiddenException(messageKey);
  }

  static notFound(messageKey: string) {
    return new NotFoundException(messageKey);
  }

  static unauthorized(messageKey: string) {
    return new UnauthorizedException(messageKey);
  }

  static internal(messageKey: string) {
    return new InternalServerErrorException(messageKey);
  }
}
