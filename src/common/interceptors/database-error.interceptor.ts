import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  UniqueConstraintViolationException,
  ForeignKeyConstraintViolationException,
  NotNullConstraintViolationException,
  NotFoundError,
} from '@mikro-orm/core';
import { I18nContext } from 'nestjs-i18n';

const ERROR_MAPPINGS = [
  {
    error: UniqueConstraintViolationException,
    HttpException: ConflictException,
    i18nKey: 'error-db-unique-violation',
    defaultMessage: 'Bản ghi dữ liệu đã tồn tại trong hệ thống.',
  },
  {
    error: ForeignKeyConstraintViolationException,
    HttpException: BadRequestException,
    i18nKey: 'error-db-foreign-key-violation',
    defaultMessage: 'Lỗi ràng buộc liên kết dữ liệu (khóa ngoại không hợp lệ).',
  },
  {
    error: NotNullConstraintViolationException,
    HttpException: BadRequestException,
    i18nKey: 'error-db-not-null-violation',
    defaultMessage: 'Thông tin bắt buộc không được để trống.',
  },
  {
    error: NotFoundError,
    HttpException: NotFoundException,
    i18nKey: 'error-db-not-found',
    defaultMessage: 'Không tìm thấy bản ghi dữ liệu yêu cầu.',
  },
];

@Injectable()
export class DatabaseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const matched = ERROR_MAPPINGS.find((m) => error instanceof m.error);
        if (matched) {
          const i18n = I18nContext.current();
          const message = i18n
            ? (i18n.t(`error-message.${matched.i18nKey}`) as string)
            : matched.defaultMessage;
          return throwError(() => new matched.HttpException(message));
        }
        return throwError(() => error);
      }),
    );
  }
}
