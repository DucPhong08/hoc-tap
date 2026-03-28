import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Bangkok',
    }).format(new Date());
  }
}
