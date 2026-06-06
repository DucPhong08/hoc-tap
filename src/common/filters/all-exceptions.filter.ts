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
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        message = (res as any).message;
      } else {
        message = exception.message;
      }
    }

    // Tự động dịch lỗi nếu co I18nContext
    const i18n = I18nContext.current();
    if (i18n) {
      const translateKey = (key: string): string => {
        const fullKey = `error-message.${key}`;
        const translated = String(i18n.t(fullKey));
        return translated !== fullKey ? translated : key;
      };

      if (typeof message === 'string') {
        message = translateKey(message);
      } else if (Array.isArray(message)) {
        message = message
          .map((msg) => (typeof msg === 'string' ? translateKey(msg) : msg))
          .join(', ');
      }
    } else if (Array.isArray(message)) {
      message = message.join(', ');
    }

    if (status >= 500) {
      this.logger.error('Unhandled Exception', {
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn(`Client Error [${status}]: ${message}`);
    }

    response.status(status).json({
      success: false,
      message,
    });
  }
}
