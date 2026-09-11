import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  // Định nghĩa các tác vụ định kỳ (Cron/Interval) khi cần thiết
}
