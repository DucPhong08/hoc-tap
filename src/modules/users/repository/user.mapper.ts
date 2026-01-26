/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { User, UserRecord } from '../domain/user.model';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserMapper {
  toModel(entity: UserEntity): User {
    const record = new UserRecord(
      entity.firstName,
      entity.lastName,
      entity.email,
    );
    // BaseEntity properties are inherited
    return new User(
      (entity as any).id,
      record,
      (entity as any).createdAt,
      (entity as any).updatedAt,
    );
  }

  toEntity(model: User): UserEntity {
    const entity = new UserEntity();
    (entity as any).id = model.id;
    entity.firstName = model.record.firstName;
    entity.lastName = model.record.lastName;
    entity.email = model.record.email;
    (entity as any).createdAt = model.createdAt;
    (entity as any).updatedAt = model.updatedAt;
    return entity;
  }

  partialToEntity(data: Partial<User>): Partial<UserEntity> {
    const entity: Partial<UserEntity> = {};
    if (data.record) {
      if (data.record.firstName) entity.firstName = data.record.firstName;
      if (data.record.lastName) entity.lastName = data.record.lastName;
      if (data.record.email) entity.email = data.record.email;
    }
    return entity;
  }
}
