import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      errors: this.extractErrors(exceptionResponse),
    };

    this.logger.error(`HTTP ${status} Error`, {
      ...errorResponse,
      stack: exception.stack,
    });

    response.status(status).json(errorResponse);
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && 'message' in response) {
      const msg = (response as any).message;
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    return 'Internal server error';
  }

  private extractErrors(response: string | object): any[] {
    if (typeof response === 'object' && 'errors' in response) {
      return (response as any).errors;
    }
    return [];
  }
}
