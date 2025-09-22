// Browser-compatible logger that mimics Winston API without Node.js dependencies

// Log levels configuration
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  UI = 'ui',
  WEBSOCKET = 'websocket',
  API = 'api',
  AUTH = 'auth',
  CALL = 'call',
  CHAT = 'chat',
  PERFORMANCE = 'performance',
}

// Log entry interface
interface LogEntry {
  level: string;
  message: string;
  meta?: any;
  timestamp: string;
  service: string;
}

// Default configuration
const DEFAULT_CONFIG = {
  serviceName: 'vidya-shakti-frontend',
  logLevel: LogLevel.INFO,
  enableConsole: true,
  enableFile: false, // File logging not available in browser
  logDirectory: 'logs',
  maxFiles: 7,
  maxSize: '5m'
};

// Log level priority
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  ui: 4,
  websocket: 4,
  api: 4,
  auth: 4,
  call: 4,
  chat: 4,
  performance: 4,
};

// Color codes for console output
const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
  ui: '\x1b[35m',    // Magenta
  websocket: '\x1b[34m', // Blue
  api: '\x1b[32m',   // Green
  auth: '\x1b[93m',  // Bright Yellow
  call: '\x1b[94m',  // Bright Blue
  chat: '\x1b[95m',  // Bright Magenta
  performance: '\x1b[96m', // Bright Cyan
  reset: '\x1b[0m'   // Reset
};

/**
 * Browser-compatible Logger Service
 */
export class LoggerService {
  private config: any;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 logs in memory

  constructor(config: any) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  /**
   * Log a UI-related message
   */
  ui(message: string, meta?: any): void {
    this.log('ui', message, meta);
  }

  /**
   * Log a WebSocket-related message
   */
  websocket(message: string, meta?: any): void {
    this.log('websocket', message, meta);
  }

  /**
   * Log an API-related message
   */
  api(message: string, meta?: any): void {
    this.log('api', message, meta);
  }

  /**
   * Log an authentication-related message
   */
  auth(message: string, meta?: any): void {
    this.log('auth', message, meta);
  }

  /**
   * Log a call-related message
   */
  call(message: string, meta?: any): void {
    this.log('call', message, meta);
  }

  /**
   * Log a chat-related message
   */
  chat(message: string, meta?: any): void {
    this.log('chat', message, meta);
  }

  /**
   * Log a performance-related message
   */
  performance(message: string, meta?: any): void {
    this.log('performance', message, meta);
  }

  /**
   * Create a child logger with additional metadata
   */
  child(meta: any): LoggerService {
    const childLogger = new LoggerService(this.config);
    childLogger.config = { ...this.config, ...meta };
    return childLogger;
  }

  /**
   * Core logging method
   */
  private log(level: string, message: string, meta?: any): void {
    // Check if we should log this level
    if (LOG_LEVELS[level as keyof typeof LOG_LEVELS] > LOG_LEVELS[this.config.logLevel as keyof typeof LOG_LEVELS]) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      meta,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Store in localStorage for debugging (optional)
    if (typeof window !== 'undefined' && this.config.enableFile) {
      this.logToLocalStorage(logEntry);
    }
  }

  /**
   * Log to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const color = COLORS[entry.level as keyof typeof COLORS] || COLORS.reset;
    const reset = COLORS.reset;
    
    const formattedMessage = `${color}[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.service}]: ${entry.message}${reset}`;
    
    if (entry.meta) {
      console.log(formattedMessage, entry.meta);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Store logs in localStorage for debugging
   */
  private logToLocalStorage(entry: LogEntry): void {
    try {
      const key = `logs_${this.config.serviceName}`;
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      existingLogs.push(entry);
      
      // Keep only last 100 logs in localStorage
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem(key, JSON.stringify(existingLogs));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Get stored logs from localStorage
   */
  getStoredLogs(): LogEntry[] {
    try {
      const key = `logs_${this.config.serviceName}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs(): void {
    try {
      const key = `logs_${this.config.serviceName}`;
      localStorage.removeItem(key);
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Logger Factory for creating logger instances
 */
export class LoggerFactory {
  private static instances = new Map<string, LoggerService>();

  static createLogger(config: any): LoggerService {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const loggerKey = fullConfig.serviceName;
    
    if (this.instances.has(loggerKey)) {
      return this.instances.get(loggerKey)!;
    }
    
    const logger = new LoggerService(fullConfig);
    this.instances.set(loggerKey, logger);
    return logger;
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}

/**
 * Configuration loader from environment variables
 */
export class LoggerConfigLoader {
  static loadConfig() {
    const config = {
      serviceName: import.meta.env.VITE_LOG_SERVICE_NAME || DEFAULT_CONFIG.serviceName,
      logLevel: import.meta.env.VITE_LOG_LEVEL || DEFAULT_CONFIG.logLevel,
      enableConsole: import.meta.env.VITE_LOG_ENABLE_CONSOLE === 'true' || DEFAULT_CONFIG.enableConsole,
      enableFile: import.meta.env.VITE_LOG_ENABLE_FILE === 'true' || DEFAULT_CONFIG.enableFile,
      logDirectory: import.meta.env.VITE_LOG_DIRECTORY || DEFAULT_CONFIG.logDirectory,
      maxFiles: parseInt(import.meta.env.VITE_LOG_MAX_FILES || '7'),
      maxSize: import.meta.env.VITE_LOG_MAX_SIZE || DEFAULT_CONFIG.maxSize
    };

    return config;
  }
}

// Create default logger instance
const config = LoggerConfigLoader.loadConfig();
export const logger = new LoggerService(config);

// Export factory functions
export const createLogger = (config: any): LoggerService => {
  return LoggerFactory.createLogger(config);
};

export const createLoggerFromEnv = (): LoggerService => {
  const config = LoggerConfigLoader.loadConfig();
  return new LoggerService(config);
};

export default logger;