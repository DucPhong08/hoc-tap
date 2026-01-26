import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { ProductEntity } from './entities/product.entity';

@ApiTags('products')
@Controller('products')
export class ProductController extends BaseCrudController<
  ProductEntity,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(service: ProductService) {
    super(
      service,
      'Product',
      ProductEntity,
      CreateProductDto,
      UpdateProductDto,
    );
  }
}
