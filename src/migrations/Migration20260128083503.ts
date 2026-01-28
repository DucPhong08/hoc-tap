import { Migration } from '@mikro-orm/migrations';

export class Migration20260128083503 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "users" add column "provider" varchar(255) not null default 'local', add column "provider_id" varchar(255) null, add column "avatar" varchar(255) null;`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_email_unique";`);
  }
}
