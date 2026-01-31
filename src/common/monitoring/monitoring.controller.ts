import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('monitoring')
export class MonitoringController {
  @Get('health')
  @Public()
  getHealth() {
    return {
      status: 'ok',
      workerId: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('worker-info')
  @Public()
  getWorkerInfo() {
    return {
      workerId: process.pid,
      isCluster: process.env.CLUSTER_ENABLED === 'true',
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
      },
      cpu: process.cpuUsage(),
      uptime: `${Math.round(process.uptime())}s`,
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  @Get('logs/recent')
  @Public()
  getRecentLogs() {
    try {
      const logPath = path.join('logs', 'app.log');
      if (!fs.existsSync(logPath)) {
        return { logs: [], message: 'No logs found' };
      }

      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      const recent = lines.slice(-50); // Last 50 lines

      return {
        total: lines.length,
        recent: recent.length,
        logs: recent,
      };
    } catch (error) {
      return { error: 'Failed to read logs', message: error.message };
    }
  }

  @Get('logs/errors')
  @Public()
  getErrorLogs() {
    try {
      const logPath = path.join('logs', 'error.log');
      if (!fs.existsSync(logPath)) {
        return { logs: [], message: 'No error logs found' };
      }

      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      const recent = lines.slice(-20); // Last 20 errors

      return {
        total: lines.length,
        recent: recent.length,
        logs: recent,
      };
    } catch (error) {
      return { error: 'Failed to read error logs', message: error.message };
    }
  }

  @Get('logs/cluster')
  @Public()
  getClusterLogs() {
    try {
      const logPath = path.join('logs', 'cluster.log');
      if (!fs.existsSync(logPath)) {
        return { logs: [], message: 'No cluster logs found' };
      }

      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      const recent = lines.slice(-30); // Last 30 lines

      return {
        total: lines.length,
        recent: recent.length,
        logs: recent,
      };
    } catch (error) {
      return { error: 'Failed to read cluster logs', message: error.message };
    }
  }

  @Get('stats')
  @Public()
  getStats() {
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
