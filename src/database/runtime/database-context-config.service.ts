import { Injectable } from '@nestjs/common';
import { DatabaseContextRegistry } from '../registration/database-context.registry';
import { DatabaseEnvironmentReader } from '../env/database-environment.reader';
import { DatabaseEnvironmentValidator } from '../env/database-environment.validator';
import { ResolvedDatabaseContext } from '../types/database.types';

@Injectable()
export class DatabaseContextConfigService {
  private readonly cache = new Map<string, ResolvedDatabaseContext>();

  constructor(
    private readonly contextRegistry: DatabaseContextRegistry,
    private readonly environmentReader: DatabaseEnvironmentReader,
    private readonly environmentValidator: DatabaseEnvironmentValidator,
  ) {}

  getContext(contextName: string): ResolvedDatabaseContext {
    const cachedContext = this.cache.get(contextName);
    if (cachedContext) {
      return cachedContext;
    }

    const contextDefinition = this.contextRegistry.get(contextName);
    const environmentSnapshot = this.environmentReader.read(contextName);
    const resolvedSettings = this.environmentValidator.validate(
      contextDefinition,
      environmentSnapshot,
    );

    const resolvedContext: ResolvedDatabaseContext = {
      definition: contextDefinition,
      settings: resolvedSettings,
    };

    this.cache.set(contextName, resolvedContext);

    return resolvedContext;
  }
}
