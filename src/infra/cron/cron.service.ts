import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  // // Chạy mỗi phút
  // @Cron(CronExpression.EVERY_MINUTE)
  // handleEveryMinute() {
  //     this.logger.debug('Cron job: Every minute');
  // }

  // // Chạy mỗi 5 phút
  // @Cron('*/5 * * * *')
  // handleEvery5Minutes() {
  //     this.logger.debug('Cron job: Every 5 minutes');
  // }

  // // Chạy mỗi giờ
  // @Cron(CronExpression.EVERY_HOUR)
  // handleEveryHour() {
  //     this.logger.debug('Cron job: Every hour');
  // }

  // // Chạy mỗi ngày lúc 00:00
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // handleMidnight() {
  //     this.logger.debug('Cron job: Midnight');
  // }

  // // Chạy mỗi ngày lúc 9:00 sáng
  // @Cron('0 9 * * *')
  // handleMorning() {
  //     this.logger.debug('Cron job: 9:00 AM daily');
  // }

  // // Chạy thứ 2 đến thứ 6 lúc 8:00 sáng
  // @Cron('0 8 * * 1-5')
  // handleWeekdayMorning() {
  //     this.logger.debug('Cron job: Weekday 8:00 AM');
  // }

  // // Chạy mỗi 10 giây (dùng Interval)
  // @Interval(10000)
  // handleInterval() {
  //     this.logger.debug('Interval: Every 10 seconds');
  // }

  // // Chạy 1 lần sau 5 giây khi app start (dùng Timeout)
  // @Timeout(5000)
  // handleTimeout() {
  //     this.logger.debug('Timeout: After 5 seconds');
  // }

  // // Example: Cleanup old logs
  // @Cron(CronExpression.EVERY_DAY_AT_1AM)
  // async cleanupOldLogs() {
  //     this.logger.log('Starting cleanup old logs...');
  //     // TODO: Implement cleanup logic
  // }

  // // Example: Send daily report
  // @Cron('0 18 * * *') // 6:00 PM daily
  // async sendDailyReport() {
  //     this.logger.log('Sending daily report...');
  //     // TODO: Implement report logic
  // }

  // // Example: Sync data
  // @Cron('0 */2 * * *') // Every 2 hours
  // async syncData() {
  //     this.logger.log('Syncing data...');
  // }
}
