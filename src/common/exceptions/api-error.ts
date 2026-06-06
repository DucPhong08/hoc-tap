import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

export class ApiError {
  static BadRequest(messageKey: string) {
    return new BadRequestException(messageKey);
  }

  static BadReq(messageKey: string) {
    return this.BadRequest(messageKey);
  }

  static Conflict(messageKey: string) {
    return new ConflictException(messageKey);
  }

  static Forbidden(messageKey: string) {
    return new ForbiddenException(messageKey);
  }

  static NotFound(messageKey: string) {
    return new NotFoundException(messageKey);
  }

  static Unauthorized(messageKey: string) {
    return new UnauthorizedException(messageKey);
  }

  static Internal(messageKey: string) {
    return new InternalServerErrorException(messageKey);
  }
}
