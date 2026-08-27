import { Filter, parseFilterRules } from './filter';
import { OperatorType } from '@/common/enums/operator-type.enum';
import { BaseEntity } from '@/common/entity/base.entity';

interface TestEntity extends BaseEntity {
  code?: string;
  name?: string;
}

describe('Filter & parseFilterRules Helpers', () => {
  describe('parseFilterRules', () => {
    it('parses filter rules correctly', () => {
      const rules = [
        { field: 'name', operator: OperatorType.EQUAL, values: 'John' },
        { field: 'age', operator: OperatorType.GREATER_THAN, values: 18 },
      ];
      const result = parseFilterRules(rules as any);
      expect(result).toEqual({
        $and: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }],
      });
    });

    it('handles single rule without $and wrapper', () => {
      const rules = [
        { field: 'id', operator: OperatorType.EQUAL, values: '123' },
      ];
      const result = parseFilterRules(rules as any);
      expect(result).toEqual({ id: { $eq: '123' } });
    });
  });

  describe('Filter', () => {
    it('applies default soft delete filter deletedAt: null on empty condition', () => {
      expect(Filter({})).toEqual({ deletedAt: null });
    });

    it('merges deletedAt: null into flat object condition', () => {
      expect(Filter<TestEntity>({ code: 'ADM' })).toEqual({
        code: 'ADM',
        deletedAt: null,
      });
    });

    it('bypasses deletedAt filter when softDelete option is true', () => {
      expect(Filter<TestEntity>({ code: 'ADM' }, { softDelete: true })).toEqual(
        {
          code: 'ADM',
        },
      );
    });

    it('preserves caller explicit deletedAt filter if present', () => {
      const condition = { deletedAt: { $ne: null } };
      expect(Filter(condition)).toEqual({ deletedAt: { $ne: null } });
    });

    it('wraps complex $or / $and condition with $and and deletedAt: null', () => {
      const condition = { $or: [{ id: '1' }, { id: '2' }] };
      expect(Filter<TestEntity>(condition)).toEqual({
        $and: [{ $or: [{ id: '1' }, { id: '2' }] }, { deletedAt: null }],
      });
    });
  });
});
