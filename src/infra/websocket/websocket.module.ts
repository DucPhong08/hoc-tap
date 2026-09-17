import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [AuthModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
