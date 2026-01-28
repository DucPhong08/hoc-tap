import { Type } from '@nestjs/common';
import { UserEntity } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

export const MainEntities: Type[] = [UserEntity, ProductEntity];
