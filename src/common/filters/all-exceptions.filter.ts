import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Lấy nội dung lỗi
    let rawMessage: string | string[] = 'Internal server error';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        rawMessage = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as Record<string, unknown>).message;
        if (typeof msg === 'string' || Array.isArray(msg)) {
          rawMessage = msg as string | string[];
        }
      } else {
        rawMessage = exception.message;
      }
    } else if (exception instanceof Error) {
      rawMessage = exception.message;
    }

    // Dịch lỗi qua i18n nếu có mã tương ứng
    const i18n = I18nContext.current(host);
    const translateKey = (key: string): string => {
      if (!i18n) return key;
      const fullKey = `error-message.${key}`;
      const translated = String(i18n.t(fullKey));
      return translated !== fullKey ? translated : key;
    };

    const message = Array.isArray(rawMessage)
      ? rawMessage.map((msg) => translateKey(String(msg))).join(', ')
      : translateKey(rawMessage);

    // Ghi log lỗi
    const method = request?.method ?? 'UNKNOWN';
    const url = request?.url ?? '';
    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[${method}] ${url} 500 Server Error - ${message}`,
        stack,
      );
    } else {
      this.logger.warn(`[${method}] ${url} [${status}]: ${message}`);
    }

    response.status(status).json({
      success: false,
      message,
    });
  }
}
