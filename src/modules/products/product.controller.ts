import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseCrudControllerFactory } from '../../common/controllers/base-crud.controller';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { ProductEntity } from './entities/product.entity';

const BaseController = BaseCrudControllerFactory(
  ProductEntity,
  CreateProductDto,
  UpdateProductDto,
  {
    routes: {
      create: true,
      getMany: true,
      getPage: true,
      getById: true,
      getOne: true,
      updateById: true,
      updateByIds: true,
      upsert: true,
      getOneOrUpsert: true,
      deleteById: true,
      deleteByIds: true,
    },
  },
);

@ApiTags('products')
@Controller('products')
export class ProductController extends BaseController {
  constructor(service: ProductService) {
    super(service, 'Product');
  }
}
