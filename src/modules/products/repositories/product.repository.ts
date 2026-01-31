import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectEntityManager, InjectRepository } from '@mikro-orm/nestjs';
import { MikroOrmBaseRepository } from '../../../common/repositories/mikro-orm-base.repository';
import { ProductEntity } from '../entities/product.entity';
import { DB_CONTEXTS } from '../../database/constants';

@Injectable()
export class ProductRepository extends MikroOrmBaseRepository<ProductEntity> {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    em: EntityManager,
    @InjectRepository(ProductEntity, DB_CONTEXTS.MAIN)
    repository: EntityRepository<ProductEntity>,
  ) {
    super(em, repository);
  }
}
