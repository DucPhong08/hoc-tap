import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { Role } from '@/common/constants/role.constant';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      workerId: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  @Authorize(Role.ADMIN)
  stats() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      worker: {
        pid: process.pid,
        uptime: process.uptime(),
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        heapUsedPercent: (
          (memUsage.heapUsed / memUsage.heapTotal) *
          100
        ).toFixed(2),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    };
  }
}
