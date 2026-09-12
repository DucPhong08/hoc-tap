import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '@/common/decorators/public.decorator';
import {
  Authorize,
  Authorization,
} from '@/common/decorators/authorize.decorator';
import { Role } from '@/common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('monitoring')
@Controller('monitoring')
@Authorization(Role.ADMIN)
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

  private async readLastLines(
    filePath: string,
    maxLines: number,
    maxBytes = 64 * 1024,
  ): Promise<string[]> {
    const handle = await fs.promises.open(filePath, 'r');
    try {
      const stat = await handle.stat();
      const fileSize = stat.size;
      if (fileSize === 0) return [];

      const readBytes = Math.min(fileSize, maxBytes);
      const position = fileSize - readBytes;
      const buffer = Buffer.alloc(readBytes);

      await handle.read(buffer, 0, readBytes, position);
      const content = buffer.toString('utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      return lines.slice(-maxLines);
    } finally {
      await handle.close();
    }
  }

  @Get('logs/recent')
  @Authorize(Role.ADMIN)
  async recentLogs() {
    try {
      const logPath = path.join('logs', 'app.log');
      if (!fs.existsSync(logPath)) {
        return { logs: [], message: 'No logs found' };
      }

      const recent = await this.readLastLines(logPath, 50);
      return {
        recent: recent.length,
        logs: recent,
      };
    } catch (error) {
      return {
        error: 'Failed to read logs',
        message: (error as Error)?.message ?? String(error),
      };
    }
  }

  @Get('logs/errors')
  @Authorize(Role.ADMIN)
  async errorLogs() {
    try {
      const logPath = path.join('logs', 'error.log');
      if (!fs.existsSync(logPath)) {
        return { logs: [], message: 'No error logs found' };
      }

      const recent = await this.readLastLines(logPath, 20);
      return {
        recent: recent.length,
        logs: recent,
      };
    } catch (error) {
      return {
        error: 'Failed to read error logs',
        message: (error as Error)?.message ?? String(error),
      };
    }
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
