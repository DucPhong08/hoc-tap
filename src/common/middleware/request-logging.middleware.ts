import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      const durationInMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      this.logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${durationInMs.toFixed(2)}ms`,
      );
    });

    next();
  }
}
