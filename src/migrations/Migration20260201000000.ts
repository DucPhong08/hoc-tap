import { Migration } from '@mikro-orm/migrations';

export class Migration20260201000000 extends Migration {
  override up(): void {
    // Seed settings với cấu trúc key-value mới
    this.addSql(`
            INSERT INTO settings (_id, key, value, created_at, updated_at)
            VALUES
                ('11111111-1111-1111-1111-111111111111', 'MAINTENANCE_SETTINGS', '{"scheduledStart":"2026-02-15T00:00:00.000Z","scheduledEnd":"2026-02-15T04:00:00.000Z","titleVi":"Hệ thống đang bảo trì","titleEn":"System Under Maintenance","messageVi":"Hệ thống đang được bảo trì định kỳ. Vui lòng quay lại sau.","messageEn":"System is under scheduled maintenance. Please come back later.","enabled":false}', NOW(), NOW()),
                ('22222222-2222-2222-2222-222222222222', 'GENERAL_INFO', '{"appName":"Hệ thống quản lý","appDescription":"Hệ thống quản lý thông tin","defaultLanguage":"vi-VN","timezone":"Asia/Ho_Chi_Minh","contactEmail":"contact@example.com"}', NOW(), NOW()),
                ('33333333-3333-3333-3333-333333333333', 'TIME_DANG_KY_LICH_TUAN', '{"name":"registration_time_weekly","value":"2026-02-01T00:00:00.000Z","description":"Thời gian đăng ký lịch tuần","label":"Thời gian đăng ký lịch"}', NOW(), NOW())
            ON CONFLICT (key) DO NOTHING;
        `);
  }

  override down(): void {
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
