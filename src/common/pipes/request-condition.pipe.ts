import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OperatorType } from '@/common/enums/operator-type.enum';

const VALID_OPERATORS = new Set(Object.values(OperatorType));

function validateFilterRules(rules: unknown[]): void {
  for (const [index, item] of rules.entries()) {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException(
        `Filter rule tại vị trí [${index}] phải là một object`,
      );
    }
    const rule = item as Record<string, unknown>;
    if (!rule.field || typeof rule.field !== 'string') {
      throw new BadRequestException(
        `Trường 'field' tại rule [${index}] không hợp lệ`,
      );
    }
    if (
      rule.field.includes('__proto__') ||
      rule.field.includes('prototype') ||
      rule.field.includes('constructor')
    ) {
      throw new BadRequestException(
        `Trường 'field' tại rule [${index}] chứa ký tự không được phép`,
      );
    }
    if (!rule.operator || !VALID_OPERATORS.has(rule.operator as OperatorType)) {
      throw new BadRequestException(
        `Operator '${String(rule.operator)}' tại rule [${index}] không hợp lệ.`,
      );
    }
  }
}

@Injectable()
export class RequestConditionPipe<T = unknown> implements PipeTransform<
  string,
  Promise<T>
> {
  constructor(
    private readonly schema: Type<T>,
    private readonly required = false,
  ) {}

  async transform(value: string | undefined): Promise<T> {
    if (!value) {
      if (this.required)
        throw new BadRequestException('Condition không được để trống');
      return {} as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException('Condition phải là chuỗi JSON hợp lệ');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new BadRequestException('Condition phải là JSON object hoặc array');
    }

    // Mảng filter rules nâng cao
    if (Array.isArray(parsed)) {
      validateFilterRules(parsed);
      if (this.required && parsed.length === 0) {
        throw new BadRequestException('Condition không được để rỗng');
      }
      return parsed as unknown as T;
    }

    const instance = plainToInstance(this.schema, parsed, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      const msgs = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join('; ');
      throw new BadRequestException(`Condition không hợp lệ: ${msgs}`);
    }

    if (this.required && Object.keys(instance as object).length === 0) {
      throw new BadRequestException('Condition không được để rỗng');
    }

    return instance;
  }
}

export const ConditionQueryPipe = RequestConditionPipe;
