import { Migration } from '@mikro-orm/migrations';

export class Migration20260128114103 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "products" add column "sku" varchar(50) null;`);
  }
}
