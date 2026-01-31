import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import type { Type, ValidationPipeOptions } from '@nestjs/common';

/**
 * Abstract validation pipe that validates specific parameter types
 * with specific DTO classes
 */
@Injectable()
export class AbstractValidationPipe implements PipeTransform {
  private validationPipe: ValidationPipe;

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

    // If no target type for this metadata type, return value as-is
    if (!targetType) {
      return value;
    }

    // Override metadata type to use our target DTO
    return this.validationPipe.transform(value, {
      ...metadata,
      metatype: targetType,
    });
  }
}
