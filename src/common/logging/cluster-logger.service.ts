import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable({ scope: Scope.DEFAULT })
export class ClusterLogger implements LoggerService {
  private logDir = 'logs';
  private workerId = process.pid;
  private isCluster = process.env.CLUSTER_ENABLED === 'true';

  constructor() {
    // Create logs directory if not exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const workerInfo = this.isCluster
      ? `[Worker-${this.workerId}]`
      : '[Single]';
    const contextInfo = context ? `[${context}]` : '';

    return `${timestamp} ${level} ${workerInfo} ${contextInfo} ${this.stringify(message)}`;
  }

  private stringify(message: any): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) {
      return `${message.message}\n${message.stack}`;
    }
    return JSON.stringify(message);
  }

  private writeToFile(filename: string, message: string): void {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, message + '\n');
  }

  private writeToConsole(level: string, message: string): void {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      LOG: '\x1b[36m', // Cyan
      DEBUG: '\x1b[35m', // Magenta
      VERBOSE: '\x1b[37m', // White
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level] || ''}${message}${reset}`);
  }

  log(message: any, context?: string): void {
    const formatted = this.formatMessage('LOG', message, context);
    this.writeToConsole('LOG', formatted);
    this.writeToFile('app.log', formatted);
  }

  error(message: any, trace?: string, context?: string): void {
    const formatted = this.formatMessage('ERROR', message, context);
    const fullMessage = trace ? `${formatted}\n${trace}` : formatted;

    this.writeToConsole('ERROR', fullMessage);
    this.writeToFile('error.log', fullMessage);
    this.writeToFile('app.log', fullMessage);
  }

  warn(message: any, context?: string): void {
    const formatted = this.formatMessage('WARN', message, context);
    this.writeToConsole('WARN', formatted);
    this.writeToFile('app.log', formatted);
  }

  debug(message: any, context?: string): void {
    const formatted = this.formatMessage('DEBUG', message, context);
    this.writeToConsole('DEBUG', formatted);
    this.writeToFile('debug.log', formatted);
  }

  verbose(message: any, context?: string): void {
    const formatted = this.formatMessage('VERBOSE', message, context);
    this.writeToConsole('VERBOSE', formatted);
    this.writeToFile('app.log', formatted);
  }

  // Custom method for cluster-specific logging
  logWorkerInfo(message: string): void {
    const info = {
      workerId: this.workerId,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      message,
    };
    this.log(info, 'WorkerInfo');
  }

  // Log request with worker info
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ): void {
    const message = `${method} ${url} ${statusCode} ${duration}ms`;
    this.log(message, 'Request');

    // Write to separate request log
    this.writeToFile('requests.log', this.formatMessage('REQUEST', message));
  }
}
