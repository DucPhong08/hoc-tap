import { Inject, type Provider, type Type } from '@nestjs/common';
import type { EntityType } from '@/common/enums/entity.enum';

export const RepositoryProviderName = (name: EntityType) =>
  `${name}BaseRepository`;

export const RepositoryProvider = (
  name: EntityType,
  repository: Type<any>,
): Provider => {
  return { provide: RepositoryProviderName(name), useClass: repository };
};

export const InjectRepository = (name: EntityType) =>
  Inject(RepositoryProviderName(name));
