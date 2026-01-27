import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseBooleanPipe implements PipeTransform<string, boolean> {
  transform(value: string): boolean {
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
      return false;
    }
    throw new BadRequestException(
      `Invalid boolean value: ${value}. Expected 'true', 'false', '1', or '0'`,
    );
  }
}
