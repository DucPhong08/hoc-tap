import { Injectable } from '@nestjs/common';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseContextDefinition } from '../types/database.types';
import { MAIN_DATABASE_CONTEXT } from './main-database.registration';

@Injectable()
export class DatabaseContextRegistry {
  private readonly contexts = new Map<string, DatabaseContextDefinition>([
    [MAIN_DATABASE_CONTEXT.contextName, MAIN_DATABASE_CONTEXT],
  ]);

  get(contextName: string): DatabaseContextDefinition {
    const contextDefinition = this.contexts.get(contextName);

    if (!contextDefinition) {
      throw new DatabaseConfigurationError(
        `Database context "${contextName}" is not registered.`,
      );
    }

    return contextDefinition;
  }
}
