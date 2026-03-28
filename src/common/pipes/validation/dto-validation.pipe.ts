import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import type { Type, ValidationPipeOptions } from '@nestjs/common';

@Injectable()
export class DtoValidationPipe implements PipeTransform {
  private readonly validationPipe: ValidationPipe;

  constructor(
    options: ValidationPipeOptions,
    private readonly targetTypes: {
      body?: Type<unknown>;
      query?: Type<unknown>;
      param?: Type<unknown>;
    },
  ) {
    this.validationPipe = new ValidationPipe({
      ...options,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  }

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const targetType =
      this.targetTypes[metadata.type as keyof typeof this.targetTypes];

    if (!targetType) {
      return value;
    }

    return this.validationPipe.transform(value, {
      ...metadata,
      metatype: targetType,
    });
  }
}
