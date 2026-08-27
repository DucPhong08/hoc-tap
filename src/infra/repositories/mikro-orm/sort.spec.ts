import { Sort } from './sort';

describe('Sort Helper', () => {
  it('returns undefined when sort is falsy', () => {
    expect(Sort(undefined)).toBeUndefined();
    expect(Sort(null)).toBeUndefined();
    expect(Sort('')).toBeUndefined();
  });

  it('converts numeric sort values 1 and -1 to asc and desc', () => {
    expect(Sort({ createdAt: -1, name: 1 })).toEqual({
      createdAt: 'desc',
      name: 'asc',
    });
  });

  it('converts string numbers "1" and "-1" to asc and desc', () => {
    expect(Sort({ createdAt: '-1', name: '1' })).toEqual({
      createdAt: 'desc',
      name: 'asc',
    });
  });

  it('preserves standard string directions "asc", "desc", "ASC", "DESC"', () => {
    expect(Sort({ createdAt: 'desc', name: 'ASC' })).toEqual({
      createdAt: 'desc',
      name: 'asc',
    });
  });

  it('handles array of sort objects correctly', () => {
    expect(Sort([{ createdAt: -1 }, { name: 'asc' }])).toEqual([
      { createdAt: 'desc' },
      { name: 'asc' },
    ]);
  });
});
