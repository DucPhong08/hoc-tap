import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 'Internal server error';
    if (exception instanceof HttpException) {
      message = exception.message;
    }

    // Tự động dịch lỗi nếu có I18nContext
    const i18n = I18nContext.current();
    if (i18n) {
      const translateKey = (key: string): string => {
        const fullKey = `error-message.${key}`;
        const translated = i18n.t(fullKey);
        return translated !== fullKey ? translated : key;
      };

      if (typeof message === 'string') {
        message = translateKey(message);
      }
    }

    this.logger.error('Unhandled Exception', {
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      success: false,
      message,
    });
  }
}
