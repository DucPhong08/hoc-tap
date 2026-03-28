import { Options } from '@mikro-orm/core';
import {
  DatabaseDriverName,
  ResolvedDatabaseContext,
} from '../types/database.types';

export interface DatabaseDriverOptionsStrategy {
  supports(driver: DatabaseDriverName): boolean;
  buildOptions(context: ResolvedDatabaseContext): Options;
}
