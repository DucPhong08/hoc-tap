import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParsedQueryOptions {
  select?: string[];
  populate?: string[];
  sort?: Record<string, 1 | -1>;
  withDeleted?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}

@Injectable()
export class QueryOptionsPipe implements PipeTransform<
  Record<string, unknown>,
  ParsedQueryOptions
> {
  transform(value: Record<string, unknown>): ParsedQueryOptions {
    if (!value || typeof value !== 'object') {
      return {};
    }

    const parsedQuery: ParsedQueryOptions = {};

    parsedQuery.select = this.parseCsvList(value.select);
    parsedQuery.populate = this.parseCsvList(value.populate);

    if (value.sort && typeof value.sort === 'string') {
      parsedQuery.sort = this.parseSortFields(value.sort);
    }

    if (value.withDeleted !== undefined) {
      parsedQuery.withDeleted = this.parseBooleanFlag(value.withDeleted);
    }

    if (value.page !== undefined) {
      parsedQuery.page = this.parsePositiveInteger(value.page, 'page');
    }

    if (value.limit !== undefined) {
      const limit = this.parsePositiveInteger(value.limit, 'limit');
      if (limit > 1000) {
        throw new BadRequestException('limit cannot exceed 1000');
      }
      parsedQuery.limit = limit;
    }

    if (value.offset !== undefined) {
      parsedQuery.offset = this.parseNonNegativeInteger(value.offset, 'offset');
    }

    return parsedQuery;
  }

  private parseCsvList(value: unknown): string[] | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseSortFields(sortValue: string): Record<string, 1 | -1> {
    const sortFields: Record<string, 1 | -1> = {};

    sortValue.split(',').forEach((field) => {
      const normalizedField = field.trim();
      if (!normalizedField) {
        return;
      }

      if (normalizedField.startsWith('-')) {
        sortFields[normalizedField.slice(1)] = -1;
        return;
      }

      sortFields[normalizedField] = 1;
    });

    return sortFields;
  }

  private parsePositiveInteger(value: unknown, fieldName: string): number {
    const parsedValue = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }

  private parseNonNegativeInteger(value: unknown, fieldName: string): number {
    const parsedValue = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative integer`,
      );
    }

    return parsedValue;
  }

  private parseBooleanFlag(value: unknown): boolean {
    return value === 'true' || value === true;
  }
}
