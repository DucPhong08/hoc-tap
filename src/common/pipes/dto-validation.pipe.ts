import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import type { Type, ValidationPipeOptions } from '@nestjs/common';

@Injectable()
export class DtoValidationPipe implements PipeTransform {
  private readonly pipe: ValidationPipe;

  constructor(
    options: ValidationPipeOptions,
    private readonly targetTypes: {
      body?: Type<unknown>;
      query?: Type<unknown>;
      param?: Type<unknown>;
    },
  ) {
    this.pipe = new ValidationPipe({
      ...options,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
  }

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const metatype =
      this.targetTypes[metadata.type as keyof typeof this.targetTypes];
    return metatype
      ? this.pipe.transform(value, { ...metadata, metatype })
      : value;
  }
}
