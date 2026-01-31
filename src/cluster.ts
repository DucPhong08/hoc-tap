import cluster from 'cluster';
import { cpus } from 'os';
import * as fs from 'fs';
import * as path from 'path';

export class ClusterService {
  private static logDir = 'logs';

  static clusterize(callback: () => void): void {
    const numCPUs = cpus().length;
    const workers = process.env.CLUSTER_WORKERS
      ? parseInt(process.env.CLUSTER_WORKERS, 10)
      : numCPUs;

    // Create logs directory
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    if (cluster.isPrimary) {
      this.logMaster(`Master process ${process.pid} is running`);
      this.logMaster(`CPU Cores: ${numCPUs}`);
      this.logMaster(`Forking ${workers} workers...`);

      // Fork workers
      for (let i = 0; i < workers; i++) {
        const worker = cluster.fork();
        this.logMaster(`Forked worker ${worker.process.pid}`);
      }

      // Handle worker exit
      cluster.on('exit', (worker, code, signal) => {
        const reason = signal || code;
        this.logMaster(
          `⚠️  Worker ${worker.process.pid} died (${reason}). Restarting...`,
        );

        const newWorker = cluster.fork();
        this.logMaster(`✅ New worker ${newWorker.process.pid} started`);
      });

      // Handle worker online
      cluster.on('online', (worker) => {
        this.logMaster(`✅ Worker ${worker.process.pid} is online`);
      });

      // Handle worker disconnect
      cluster.on('disconnect', (worker) => {
        this.logMaster(`⚠️  Worker ${worker.process.pid} disconnected`);
      });

      // Log cluster stats every 30 seconds
      setInterval(() => {
        this.logClusterStats();
      }, 30000);

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logMaster('SIGTERM received. Shutting down gracefully...');
        if (cluster.workers) {
          for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            if (worker) {
              this.logMaster(`Killing worker ${worker.process.pid}`);
              worker.kill();
            }
          }
        }
        process.exit(0);
      });

      process.on('SIGINT', () => {
        this.logMaster('SIGINT received. Shutting down gracefully...');
        if (cluster.workers) {
          for (const id in cluster.workers) {
            cluster.workers[id]?.kill();
          }
        }
        process.exit(0);
      });
    } else {
      callback();
      this.logWorker(`Worker ${process.pid} started`);

      // Log worker memory usage every minute
      setInterval(() => {
        this.logWorkerStats();
      }, 60000);
    }
  }

  private static logMaster(message: string): void {
    const timestamp = new Date().toISOString();
    const formatted = `${timestamp} [MASTER-${process.pid}] ${message}`;
    console.log(formatted);
    this.writeToFile('cluster.log', formatted);
  }

  private static logWorker(message: string): void {
    const timestamp = new Date().toISOString();
    const formatted = `${timestamp} [WORKER-${process.pid}] ${message}`;
    console.log(formatted);
    this.writeToFile('cluster.log', formatted);
  }

  private static logClusterStats(): void {
    if (!cluster.workers) return;

    const stats = {
      timestamp: new Date().toISOString(),
      master: process.pid,
      workers: Object.values(cluster.workers).map((worker) => ({
        id: worker?.id,
        pid: worker?.process.pid,
        isDead: worker?.isDead(),
        isConnected: worker?.isConnected(),
      })),
      totalWorkers: Object.keys(cluster.workers).length,
    };

    this.logMaster(`Cluster Stats: ${JSON.stringify(stats, null, 2)}`);
  }

  private static logWorkerStats(): void {
    const stats = {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
    };

    this.logWorker(`Worker Stats: ${JSON.stringify(stats, null, 2)}`);
  }

  private static writeToFile(filename: string, message: string): void {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, message + '\n');
  }
}
