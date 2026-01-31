import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Query options parsed from query string
 */
export interface ParsedQueryOptions {
  select?: string[];
  populate?: string[];
  sort?: Record<string, 1 | -1>;
  withDeleted?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pipe to parse query options from query string
 * Handles: select, populate, sort, withDeleted, page, limit, offset
 */
@Injectable()
export class RequestQueryPipe implements PipeTransform<
  Record<string, unknown>,
  ParsedQueryOptions
> {
  transform(value: Record<string, unknown>): ParsedQueryOptions {
    if (!value || typeof value !== 'object') {
      return {};
    }

    const result: ParsedQueryOptions = {};

    // Parse select: comma-separated string -> array
    if (value.select && typeof value.select === 'string') {
      result.select = value.select
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse populate: comma-separated string -> array
    if (value.populate && typeof value.populate === 'string') {
      result.populate = value.populate
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse sort: comma-separated string with - prefix for desc
    // Example: "-createdAt,name" -> { createdAt: -1, name: 1 }
    if (value.sort && typeof value.sort === 'string') {
      result.sort = {};
      value.sort.split(',').forEach((field) => {
        const trimmed = field.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('-')) {
          result.sort![trimmed.slice(1)] = -1;
        } else {
          result.sort![trimmed] = 1;
        }
      });
    }

    // Parse withDeleted: boolean
    if (value.withDeleted !== undefined) {
      result.withDeleted =
        value.withDeleted === 'true' || value.withDeleted === true;
    }

    // Parse page: number
    if (value.page !== undefined) {
      const pageValue = value.page as string | number;
      const page = parseInt(String(pageValue), 10);
      if (isNaN(page) || page < 1) {
        throw new BadRequestException('page must be a positive integer');
      }
      result.page = page;
    }

    // Parse limit: number
    if (value.limit !== undefined) {
      const limitValue = value.limit as string | number;
      const limit = parseInt(String(limitValue), 10);
      if (isNaN(limit) || limit < 1) {
        throw new BadRequestException('limit must be a positive integer');
      }
      if (limit > 1000) {
        throw new BadRequestException('limit cannot exceed 1000');
      }
      result.limit = limit;
    }

    // Parse offset: number
    if (value.offset !== undefined) {
      const offsetValue = value.offset as string | number;
      const offset = parseInt(String(offsetValue), 10);
      if (isNaN(offset) || offset < 0) {
        throw new BadRequestException('offset must be a non-negative integer');
      }
      result.offset = offset;
    }

    return result;
  }
}
