import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { PopulationQuery } from '@/common/types/repository.types';

export interface ParsedQueryOptions {
  select?: Record<string, 1 | 0>;
  population?: PopulationQuery<any>[];
  sort?: Record<string, 1 | -1>;
  softDelete?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}

const toInt = (val: unknown, name: string, min = 0): number => {
  const n = Number(String(val).trim());
  if (!Number.isInteger(n) || n < min) {
    throw new BadRequestException(`${name} phải là số nguyên >= ${min}`);
  }
  return n;
};

@Injectable()
export class QueryOptionsPipe implements PipeTransform<
  Record<string, unknown>,
  ParsedQueryOptions
> {
  transform(query: Record<string, unknown>): ParsedQueryOptions {
    if (!query || typeof query !== 'object') return {};

    const res: ParsedQueryOptions = {};

    if (typeof query.select === 'string') {
      const select: Record<string, 1 | 0> = {};
      for (const f of query.select.split(',')) {
        const k = f.trim();
        if (k) select[k] = 1;
      }
      res.select = select;
    }

    if (typeof query.populate === 'string') {
      const paths = query.populate
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (paths.length) res.population = paths.map((path) => ({ path }));
    }

    if (typeof query.sort === 'string') {
      const sort: Record<string, 1 | -1> = {};
      for (const f of query.sort.split(',')) {
        const k = f.trim();
        if (!k) continue;
        if (k.startsWith('-')) {
          const field = k.slice(1);
          if (!field)
            throw new BadRequestException('Trường sort không được để trống');
          sort[field] = -1;
        } else {
          sort[k] = 1;
        }
      }
      res.sort = sort;
    }

    if (query.softDelete != null) {
      if (query.softDelete === 'true' || query.softDelete === true)
        res.softDelete = true;
      else if (query.softDelete === 'false' || query.softDelete === false)
        res.softDelete = false;
      else throw new BadRequestException('softDelete phải là boolean');
    }

    if (query.page != null) res.page = toInt(query.page, 'page', 1);
    if (query.limit != null) {
      const limit = toInt(query.limit, 'limit', 1);
      if (limit > 1000)
        throw new BadRequestException('limit không được vượt quá 1000');
      res.limit = limit;
    }
    if (query.offset != null) res.offset = toInt(query.offset, 'offset', 0);

    return res;
  }
}
