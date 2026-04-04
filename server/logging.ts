import { logError as dbLogError } from './db';

// ================= LOG LEVELS =================
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// ================= LOG ENTRY =================
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

// ================= LOGGER CLASS =================
class Logger {
  private service: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(service: string) {
    this.service = service;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, service, message, data, error } = entry;
    let log = `[${timestamp}] [${level}] [${service}] ${message}`;
    
    if (data) {
      log += ` ${JSON.stringify(data)}`;
    }
    
    if (error) {
      log += `\n  Error: ${error.message}`;
      if (error.stack) {
        log += `\n  Stack: ${error.stack}`;
      }
    }
    
    return log;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Print to console
    console.log(this.formatLog(entry));
  }

  debug(message: string, data?: any) {
    this.addLog(this.createEntry(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: any) {
    this.addLog(this.createEntry(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    this.addLog(this.createEntry(LogLevel.WARN, message, data));
  }

  error(message: string, error?: Error, data?: any) {
    this.addLog(this.createEntry(LogLevel.ERROR, message, data, error));
  }

  fatal(message: string, error?: Error, data?: any) {
    this.addLog(this.createEntry(LogLevel.FATAL, message, data, error));
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
  }
}

// ================= PERFORMANCE MONITOR =================
class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();

  startTimer(key: string) {
    this.metrics.set(`${key}_start`, Date.now());
  }

  endTimer(key: string): number {
    const start = this.metrics.get(`${key}_start`);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.metrics.delete(`${key}_start`);
    
    // Store metric
    const metricKey = `${key}_duration`;
    const existing = this.metrics.get(metricKey) || [];
    existing.push(duration);
    
    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(metricKey, existing);
    return duration;
  }

  getMetrics(key: string) {
    const durations = this.metrics.get(`${key}_duration`) || [];
    
    if (durations.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0
      };
    }

    const sum = durations.reduce((a: number, b: number) => a + b, 0);
    const avg = Math.round(sum / durations.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: durations.length,
      avg,
      min,
      max
    };
  }

  getAllMetrics() {
    const result: any = {};
    
    const entries = Array.from(this.metrics.entries());
    for (const [key, value] of entries) {
      if (key.endsWith('_duration') && Array.isArray(value)) {
        const metricName = key.replace('_duration', '');
        result[metricName] = this.getMetrics(metricName);
      }
    }
    
    return result;
  }
}

// ================= ERROR TRACKER =================
class ErrorTracker {
  private errors: Map<string, any> = new Map();
  private errorCounts: Map<string, number> = new Map();

  trackError(errorType: string, error: Error, context?: any) {
    const key = `${errorType}_${error.message}`;
    
    // Increment error count
    const count = (this.errorCounts.get(errorType) || 0) + 1;
    this.errorCounts.set(errorType, count);

    // Store error details
    this.errors.set(key, {
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      count
    });

    // Keep only last 100 errors
    if (this.errors.size > 100) {
      const firstKey = this.errors.keys().next().value as string;
      this.errors.delete(firstKey);
    }
  }

  getErrors(limit = 50) {
    const errors = Array.from(this.errors.values());
    return errors.slice(-limit) as any[];
  }

  getErrorStats() {
    const stats: any = {};
    
    const entries = Array.from(this.errorCounts.entries());
    for (const [type, count] of entries) {
      stats[type] = count;
    }
    
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      byType: stats
    };
  }

  clearErrors() {
    this.errors.clear();
    this.errorCounts.clear();
  }
}

// ================= GLOBAL INSTANCES =================
export const logger = new Logger('MuradAI');
export const performanceMonitor = new PerformanceMonitor();
export const errorTracker = new ErrorTracker();

// ================= UTILITY FUNCTIONS =================
export function logApiCall(
  method: string,
  url: string,
  statusCode: number,
  duration: number
) {
  logger.debug(`API Call: ${method} ${url}`, {
    statusCode,
    duration: `${duration}ms`
  });

  performanceMonitor.endTimer(`api_${method}_${url}`);
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  rowsAffected?: number
) {
  logger.debug(`Database Query`, {
    query: query.substring(0, 100),
    duration: `${duration}ms`,
    rowsAffected
  });
}

export function getSystemStatus() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    recentLogs: logger.getLogs(20),
    metrics: performanceMonitor.getAllMetrics(),
    errors: errorTracker.getErrorStats()
  };
}
