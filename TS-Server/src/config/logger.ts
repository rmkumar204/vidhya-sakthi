import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Log levels configuration
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Default configuration
const DEFAULT_CONFIG = {
  logLevel: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  logDirectory: 'logs',
  maxFiles: 14, // 2 weeks of daily logs
  maxSize: '20m'
};

/**
 * Winston Logger Factory - Implements Factory Pattern (SOLID)
 * Creates configured logger instances for the backend service
 */
export class LoggerFactory {
  private static instances = new Map<string, winston.Logger>();

  /**
   * Creates or retrieves a logger instance (Singleton pattern)
   */
  static createLogger(config: any): winston.Logger {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const loggerKey = fullConfig.serviceName;
    
    if (this.instances.has(loggerKey)) {
      return this.instances.get(loggerKey)!;
    }
    
    const logger = this.buildLogger(fullConfig);
    this.instances.set(loggerKey, logger);
    return logger;
  }

  /**
   * Builds a Winston logger with the specified configuration
   */
  private static buildLogger(config: any): winston.Logger {
    // Ensure log directory exists
    if (config.enableFile && !fs.existsSync(config.logDirectory)) {
      fs.mkdirSync(config.logDirectory, { recursive: true });
    }

    const transports: winston.transport[] = [];

    // Console transport
    if (config.enableConsole) {
      transports.push(new winston.transports.Console({
        level: config.logLevel,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `[${timestamp}] ${level} [${service}]: ${message} ${metaStr}`;
          })
        )
      }));
    }

    // File transports with daily rotation
    if (config.enableFile) {
      // Error logs
      transports.push(new winston.transports.File({
        filename: path.join(config.logDirectory, `${config.serviceName}-error.log`),
        level: LogLevel.ERROR,
        maxsize: this.parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));

      // Combined logs
      transports.push(new winston.transports.File({
        filename: path.join(config.logDirectory, `${config.serviceName}-combined.log`),
        level: config.logLevel,
        maxsize: this.parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));

      // Daily rotating logs
      transports.push(new DailyRotateFile({
        filename: path.join(config.logDirectory, `${config.serviceName}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.maxSize,
        maxFiles: config.maxFiles,
        level: config.logLevel,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    return winston.createLogger({
      level: config.logLevel,
      defaultMeta: { service: config.serviceName },
      transports,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: config.enableFile ? [
        new winston.transports.File({
          filename: path.join(config.logDirectory, `${config.serviceName}-exceptions.log`)
        })
      ] : [],
      rejectionHandlers: config.enableFile ? [
        new winston.transports.File({
          filename: path.join(config.logDirectory, `${config.serviceName}-rejections.log`)
        })
      ] : []
    });
  }

  /**
   * Parses size string (e.g., '20m', '1g') to bytes
   */
  private static parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024
    };

    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)([bkmg]?)$/);
    if (!match) return 20 * 1024 * 1024; // Default 20MB

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(value * (units[unit] || 1));
  }

  /**
   * Clears all logger instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

/**
 * Logger Service - Implements Service Pattern (SOLID)
 * Provides structured logging methods with consistent formatting
 */
export class LoggerService {
  private logger: winston.Logger;

  constructor(config: any) {
    this.logger = LoggerFactory.createLogger(config);
  }

  /**
   * Logs error messages
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * Logs warning messages
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Logs informational messages
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Logs debug messages
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Logs HTTP requests
   */
  http(message: string, meta?: any): void {
    this.logger.info(`[HTTP] ${message}`, meta);
  }

  /**
   * Logs database operations
   */
  database(message: string, meta?: any): void {
    this.logger.info(`[Database] ${message}`, meta);
  }

  /**
   * Logs authentication events
   */
  auth(message: string, meta?: any): void {
    this.logger.info(`[Auth] ${message}`, meta);
  }

  /**
   * Logs email operations
   */
  email(message: string, meta?: any): void {
    this.logger.info(`[Email] ${message}`, meta);
  }

  /**
   * Logs Google OAuth operations
   */
  oauth(message: string, meta?: any): void {
    this.logger.info(`[OAuth] ${message}`, meta);
  }

  /**
   * Creates a child logger with additional metadata
   */
  child(meta: any): LoggerService {
    const childLogger = this.logger.child(meta);
    return new Proxy(this, {
      get(target, prop) {
        if (typeof (target as any)[prop] === 'function') {
          return (message: string, childMeta?: any) => {
            (target as any)[prop](message, { ...meta, ...childMeta });
          };
        }
        return (target as any)[prop];
      }
    }) as LoggerService;
  }
}

/**
 * Configuration loader - Implements Strategy Pattern (SOLID)
 * Loads logging configuration from environment variables
 */
export class LoggerConfigLoader {
  static loadConfig() {
    return {
      serviceName: 'vidya-sakthi-backend',
      logLevel: process.env.LOG_BACKEND_LEVEL || LogLevel.INFO,
      enableConsole: process.env.LOG_BACKEND_CONSOLE !== 'false',
      enableFile: process.env.LOG_BACKEND_FILE !== 'false',
      logDirectory: process.env.LOG_BACKEND_DIRECTORY || 'logs',
      maxFiles: parseInt(process.env.LOG_BACKEND_MAX_FILES || '14'),
      maxSize: process.env.LOG_BACKEND_MAX_SIZE || '20m'
    };
  }
}

// Create default logger instance
const config = LoggerConfigLoader.loadConfig();
export const logger = new LoggerService(config);

// Export default logger factory function for easy usage
export const createLogger = (config: any): LoggerService => {
  return new LoggerService(config);
};

// Export environment-based logger creation
export const createLoggerFromEnv = (): LoggerService => {
  const config = LoggerConfigLoader.loadConfig();
  return new LoggerService(config);
};

// Create a stream object with a 'write' function that will be used by Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
