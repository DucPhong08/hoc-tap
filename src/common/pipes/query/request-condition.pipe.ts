import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ConditionQueryPipe<T = unknown> implements PipeTransform<
  string,
  Promise<T>
> {
  constructor(private readonly schema: Type<T>) {}

  async transform(value: string | undefined): Promise<T> {
    if (!value) {
      return {} as T;
    }

    const parsedCondition = this.parseConditionValue(value);
    const conditionInstance = plainToInstance(this.schema, parsedCondition, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const validationErrors = await validate(conditionInstance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
    });

    if (validationErrors.length > 0) {
      const messages = validationErrors.map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : [];
        return `${error.property}: ${constraints.join(', ')}`;
      });

      throw new BadRequestException(
        `Condition validation failed: ${messages.join('; ')}`,
      );
    }

    return conditionInstance;
  }

  private parseConditionValue(value: string): unknown {
    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(value);
    } catch {
      throw new BadRequestException('Invalid JSON in condition parameter');
    }

    if (
      !parsedValue ||
      typeof parsedValue !== 'object' ||
      Array.isArray(parsedValue)
    ) {
      throw new BadRequestException(
        'Condition parameter must be a JSON object',
      );
    }

    return parsedValue;
  }
}
