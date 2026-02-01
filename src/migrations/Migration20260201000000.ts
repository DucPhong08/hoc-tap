import { Migration } from '@mikro-orm/migrations';

export class Migration20260201000000 extends Migration {
  override async up(): Promise<void> {
    // Seed settings với cấu trúc key-value mới
    this.addSql(`
            INSERT INTO settings (key, value, created_at, updated_at)
            VALUES
                ('MAINTENANCE_SETTINGS', '{"scheduledStart":"2026-02-15T00:00:00.000Z","scheduledEnd":"2026-02-15T04:00:00.000Z","titleVi":"Hệ thống đang bảo trì","titleEn":"System Under Maintenance","messageVi":"Hệ thống đang được bảo trì định kỳ. Vui lòng quay lại sau.","messageEn":"System is under scheduled maintenance. Please come back later.","enabled":false}', NOW(), NOW()),
                ('GENERAL_INFO', '{"appName":"Hệ thống quản lý","appDescription":"Hệ thống quản lý thông tin","defaultLanguage":"vi-VN","timezone":"Asia/Ho_Chi_Minh","contactEmail":"contact@example.com"}', NOW(), NOW()),
                ('TIME_DANG_KY_LICH_TUAN', '{"name":"registration_time_weekly","value":"2026-02-01T00:00:00.000Z","description":"Thời gian đăng ký lịch tuần","label":"Thời gian đăng ký lịch"}', NOW(), NOW())
            ON CONFLICT (key) DO NOTHING;
        `);
  }

  override async down(): Promise<void> {
    this.addSql(`
            DELETE FROM settings 
            WHERE key IN (
                'MAINTENANCE_SETTINGS',
                'GENERAL_INFO',
                'TIME_DANG_KY_LICH_TUAN'
            );
        `);
  }
}
