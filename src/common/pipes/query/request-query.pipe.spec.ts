import { BadRequestException } from '@nestjs/common';
import { QueryOptionsPipe } from './request-query.pipe';

describe('QueryOptionsPipe', () => {
  const pipe = new QueryOptionsPipe();

  it('parses supported query options', () => {
    expect(
      pipe.transform({
        select: 'id, email',
        populate: 'role',
        sort: '-createdAt,email',
        softDelete: 'false',
        page: '2',
        limit: '20',
        offset: '0',
      }),
    ).toEqual({
      select: { id: 1, email: 1 },
      population: [{ path: 'role' }],
      sort: { createdAt: -1, email: 1 },
      softDelete: false,
      page: 2,
      limit: 20,
      offset: 0,
    });
  });

  it.each([
    [{ page: '1abc' }, 'page'],
    [{ limit: '1001' }, 'limit'],
    [{ offset: '-1' }, 'offset'],
    [{ softDelete: 'yes' }, 'softDelete'],
    [{ sort: '-' }, 'sort'],
  ])('rejects invalid query option %j', (query, message) => {
    expect(() => pipe.transform(query)).toThrow(BadRequestException);
    expect(() => pipe.transform(query)).toThrow(message);
  });
});
