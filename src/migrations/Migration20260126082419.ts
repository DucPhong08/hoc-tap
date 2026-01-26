import { Migration } from '@mikro-orm/migrations';

export class Migration20260126082419 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("_id" uuid not null, "created_at" timestamptz null, "updated_at" timestamptz null, "email" varchar(150) not null, "first_name" varchar(150) not null, "last_name" varchar(150) not null, "password" text null, "is_active" boolean not null default true, constraint "users_pkey" primary key ("_id"));`);
  }

}
