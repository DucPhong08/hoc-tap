import { Migration } from '@mikro-orm/migrations';

export class Migration20260128081958 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "users" add column "roles" jsonb not null default '["user"]';`,
    );
  }
}
