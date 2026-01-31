import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Pipe to parse and validate condition from query string
 * Expects JSON string in ?condition={...} query parameter
 */
@Injectable()
export class RequestConditionPipe<T = unknown> implements PipeTransform<
  string,
  Promise<T>
> {
  constructor(private readonly schema: Type<T>) {}

  async transform(value: string | undefined): Promise<T> {
    if (!value) {
      return {} as T;
    }

    let parsed: unknown;
    try {
      parsed = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new BadRequestException('Invalid JSON in condition parameter');
    }

    // Transform plain object to class instance for validation
    const instance = plainToInstance(this.schema, parsed, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    // Validate the instance
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      const messages = errors.map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints)
          : [];
        return `${err.property}: ${constraints.join(', ')}`;
      });
      throw new BadRequestException(
        `Condition validation failed: ${messages.join('; ')}`,
      );
    }

    return instance;
  }
}
