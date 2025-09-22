const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Log levels configuration
const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

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
 * Creates configured logger instances for the signaling server
 */
class LoggerFactory {
  static instances = new Map();

  /**
   * Creates or retrieves a logger instance (Singleton pattern)
   */
  static createLogger(config) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const loggerKey = fullConfig.serviceName;
    
    if (this.instances.has(loggerKey)) {
      return this.instances.get(loggerKey);
    }
    
    const logger = this.buildLogger(fullConfig);
    this.instances.set(loggerKey, logger);
    return logger;
  }

  /**
   * Builds a Winston logger with the specified configuration
   */
  static buildLogger(config) {
    // Ensure log directory exists
    if (config.enableFile && !fs.existsSync(config.logDirectory)) {
      fs.mkdirSync(config.logDirectory, { recursive: true });
    }

    const transports = [];

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
  static parseSize(sizeStr) {
    const units = {
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
  static clearInstances() {
    this.instances.clear();
  }
}

/**
 * Logger Service - Implements Service Pattern (SOLID)
 * Provides structured logging methods with consistent formatting
 */
class LoggerService {
  constructor(config) {
    this.logger = LoggerFactory.createLogger(config);
  }

  /**
   * Logs error messages
   */
  error(message, meta) {
    this.logger.error(message, meta);
  }

  /**
   * Logs warning messages
   */
  warn(message, meta) {
    this.logger.warn(message, meta);
  }

  /**
   * Logs informational messages
   */
  info(message, meta) {
    this.logger.info(message, meta);
  }

  /**
   * Logs debug messages
   */
  debug(message, meta) {
    this.logger.debug(message, meta);
  }

  /**
   * Logs WebSocket connection events
   */
  websocket(message, meta) {
    this.logger.info(`[WebSocket] ${message}`, meta);
  }

  /**
   * Logs signaling events
   */
  signaling(message, meta) {
    this.logger.info(`[Signaling] ${message}`, meta);
  }

  /**
   * Logs call events
   */
  call(message, meta) {
    this.logger.info(`[Call] ${message}`, meta);
  }

  /**
   * Logs chat events
   */
  chat(message, meta) {
    this.logger.info(`[Chat] ${message}`, meta);
  }

  /**
   * Creates a child logger with additional metadata
   */
  child(meta) {
    const childLogger = this.logger.child(meta);
    return new Proxy(this, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return (message, childMeta) => {
            target[prop](message, { ...meta, ...childMeta });
          };
        }
        return target[prop];
      }
    });
  }
}

/**
 * Configuration loader - Implements Strategy Pattern (SOLID)
 * Loads logging configuration from environment variables
 */
class LoggerConfigLoader {
  static loadConfig() {
    return {
      serviceName: 'connectsphere-signaling-server',
      logLevel: process.env.LOG_SERVER_LEVEL || LogLevel.INFO,
      enableConsole: process.env.LOG_SERVER_CONSOLE !== 'false',
      enableFile: process.env.LOG_SERVER_FILE !== 'false',
      logDirectory: process.env.LOG_SERVER_DIRECTORY || 'logs',
      maxFiles: parseInt(process.env.LOG_SERVER_MAX_FILES || '14'),
      maxSize: process.env.LOG_SERVER_MAX_SIZE || '20m'
    };
  }
}

// Create default logger instance
const config = LoggerConfigLoader.loadConfig();
const logger = new LoggerService(config);

// Export default logger factory function for easy usage
const createLogger = (config) => {
  return new LoggerService(config);
};

// Export environment-based logger creation
const createLoggerFromEnv = () => {
  const config = LoggerConfigLoader.loadConfig();
  return new LoggerService(config);
};

module.exports = {
  logger,
  createLogger,
  createLoggerFromEnv,
  LoggerService,
  LoggerFactory,
  LoggerConfigLoader,
  LogLevel
};
