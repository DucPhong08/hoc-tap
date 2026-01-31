import { wrap } from '@mikro-orm/core';
import type { UpdateData } from '../../../common/interfaces/query';

/**
 * Update Helper - Applies update operations to entity
 */
export class UpdateHelper {
  /**
   * Apply update operations to entity
   */
  static apply<E extends object>(entity: E, data: UpdateData<E>): void {
    // Check if it's operator-based update
    if (typeof data === 'object' && data !== null) {
      // $set operator
      if ('$set' in data && data.$set) {
        wrap(entity).assign(data.$set as any);
      }

      // $inc operator (increment)
      if ('$inc' in data && data.$inc) {
        for (const [key, value] of Object.entries(data.$inc)) {
          if (typeof entity[key] === 'number' && typeof value === 'number') {
            (entity as any)[key] += value;
          }
        }
      }

      // $unset operator (remove field)
      if ('$unset' in data && data.$unset) {
        for (const key of Object.keys(data.$unset)) {
          (entity as any)[key] = null;
        }
      }

      // $push operator (add to array)
      if ('$push' in data && data.$push) {
        for (const [key, value] of Object.entries(data.$push)) {
          if (Array.isArray(entity[key])) {
            (entity as any)[key].push(value);
          }
        }
      }

      // $pull operator (remove from array)
      if ('$pull' in data && data.$pull) {
        for (const [key, value] of Object.entries(data.$pull)) {
          if (Array.isArray(entity[key])) {
            const index = (entity as any)[key].indexOf(value);
            if (index > -1) {
              (entity as any)[key].splice(index, 1);
            }
          }
        }
      }

      // If no operators, treat as regular update
      if (
        !('$set' in data) &&
        !('$inc' in data) &&
        !('$unset' in data) &&
        !('$push' in data) &&
        !('$pull' in data)
      ) {
        wrap(entity).assign(data as any);
      }
    } else {
      // Regular update
      wrap(entity).assign(data as any);
    }
  }
}
