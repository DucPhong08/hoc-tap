import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ConditionQueryPipe<T = unknown> implements PipeTransform<
  string,
  Promise<T>
> {
  constructor(
    private readonly schema: Type<T>,
    private readonly required = false,
  ) {}

  async transform(value: string | undefined): Promise<T> {
    if (!value) {
      if (this.required) {
        throw new BadRequestException('Condition parameter is required');
      }
      return {} as T;
    }

    const parsedCondition = this.parseConditionValue(value);

    // Nếu condition truyền lên là mảng các FilterRule nâng cao ([{ field, operator, values }])
    if (Array.isArray(parsedCondition)) {
      return parsedCondition as unknown as T;
    }

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

    if (
      this.required &&
      Object.keys(conditionInstance as object).length === 0
    ) {
      throw new BadRequestException('Condition parameter cannot be empty');
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

    if (!parsedValue || typeof parsedValue !== 'object') {
      throw new BadRequestException(
        'Condition parameter must be a JSON object or array of filter rules',
      );
    }

    return parsedValue;
  }
}
