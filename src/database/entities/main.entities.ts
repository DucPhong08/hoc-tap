import { Type } from '@nestjs/common';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { ProductEntity } from '../../modules/products/entities/product.entity';

export const MainEntities: Type[] = [UserEntity, ProductEntity];
