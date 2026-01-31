import { Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../common/services/base-crud.service';
import { ProductEntity } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class ProductService extends BaseCrudService<ProductEntity> {
  constructor(repository: ProductRepository) {
    super(repository, {
      entityName: 'Sản phẩm',
      notFoundMessage: 'Không tìm thấy sản phẩm',
    });
  }
}
