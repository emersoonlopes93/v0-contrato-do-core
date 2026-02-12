export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  tenantId: string;
  decisionType?: string;
  orderId?: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

export class LogisticsAiLogger {
  private static formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const parts = [
      `[${timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      `[TENANT:${entry.tenantId}]`,
      entry.decisionType ? `[TYPE:${entry.decisionType}]` : '',
      entry.orderId ? `[ORDER:${entry.orderId}]` : '',
      entry.message
    ].filter(Boolean);

    return parts.join(' ');
  }

  static info(tenantId: string, message: string, options?: {
    decisionType?: string;
    orderId?: string;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      tenantId,
      message,
      ...options
    };

    console.log(this.formatLogEntry(entry));
  }

  static warn(tenantId: string, message: string, options?: {
    decisionType?: string;
    orderId?: string;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'warn',
      tenantId,
      message,
      ...options
    };

    console.warn(this.formatLogEntry(entry));
  }

  static error(tenantId: string, message: string, error?: Error, options?: {
    decisionType?: string;
    orderId?: string;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      tenantId,
      message,
      ...options
    };

    if (error) {
      console.error(this.formatLogEntry(entry), error);
    } else {
      console.error(this.formatLogEntry(entry));
    }
  }
}
