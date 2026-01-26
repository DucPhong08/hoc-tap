/* eslint-disable @typescript-eslint/require-await */
import { Migration } from '@mikro-orm/migrations';

export class Migration20260126085627 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "products" ("_id" uuid not null, "created_at" timestamptz null, "updated_at" timestamptz null, "name" varchar(200) not null, "description" text null, "price" numeric(10,2) not null, "stock" int not null default 0, constraint "products_pkey" primary key ("_id"));`,
    );
  }
}
