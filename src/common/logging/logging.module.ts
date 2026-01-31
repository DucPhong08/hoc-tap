import { Module, Global } from '@nestjs/common';
import { ClusterLogger } from './cluster-logger.service';

@Global()
@Module({
  providers: [ClusterLogger],
  exports: [ClusterLogger],
})
export class LoggingModule {}
