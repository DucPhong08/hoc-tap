import { Migration } from '@mikro-orm/migrations';

export class Migration20260210000000 extends Migration {
  override up(): void {
    this.addSql(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
    this.addSql(`
      ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
    this.addSql(`
      ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
  }

  override down(): void {
    this.addSql(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at";`);
    this.addSql(`ALTER TABLE "settings" DROP COLUMN IF EXISTS "deleted_at";`);
    this.addSql(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "deleted_at";`);
  }
}
