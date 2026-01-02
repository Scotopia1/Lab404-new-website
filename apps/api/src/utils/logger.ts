import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Simple logger utility
 * In production, replace with a proper logging service (Winston, Pino, etc.)
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (config.isDev) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext['errorName'] = error.name;
      errorContext['errorMessage'] = error.message;

      // Only include stack trace in development
      if (config.isDev) {
        errorContext['stack'] = error.stack;
      }
    } else if (error) {
      errorContext['error'] = error;
    }

    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log HTTP request (for morgan custom format)
   */
  http(message: string): void {
    console.log(`[${new Date().toISOString()}] [HTTP] ${message}`);
  }
}

export const logger = new Logger();
