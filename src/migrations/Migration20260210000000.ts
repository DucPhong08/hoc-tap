import { Migration } from '@mikro-orm/migrations';

export class Migration20260210000000 extends Migration {
  override up(): void {
    this.addSql(`
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
    this.addSql(`
      ALTER TABLE IF EXISTS "settings" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
    this.addSql(`
      ALTER TABLE IF EXISTS "audit_logs" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz DEFAULT NULL;
    `);
  }

  override down(): void {
    this.addSql(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "deleted_at";`,
    );
    this.addSql(
      `ALTER TABLE IF EXISTS "settings" DROP COLUMN IF EXISTS "deleted_at";`,
    );
    this.addSql(
      `ALTER TABLE IF EXISTS "audit_logs" DROP COLUMN IF EXISTS "deleted_at";`,
    );
  }
}
