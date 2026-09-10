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
    if (Array.isArray(parsed)) return parsed as unknown as T;

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
