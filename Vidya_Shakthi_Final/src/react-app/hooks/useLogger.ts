import { useCallback } from 'react';
import { logger, LoggerService } from '../utils/logger';

/**
 * React hook for using the logger in components
 * Provides a consistent interface for logging within React components
 */
export const useLogger = () => {
  const logError = useCallback((message: string, meta?: any) => {
    logger.error(message, { ...meta, component: 'React Component' });
  }, []);

  const logWarning = useCallback((message: string, meta?: any) => {
    logger.warn(message, { ...meta, component: 'React Component' });
  }, []);

  const logInfo = useCallback((message: string, meta?: any) => {
    logger.info(message, { ...meta, component: 'React Component' });
  }, []);

  const logDebug = useCallback((message: string, meta?: any) => {
    logger.debug(message, { ...meta, component: 'React Component' });
  }, []);

  const logUI = useCallback((message: string, meta?: any) => {
    logger.ui(message, { ...meta, component: 'React Component' });
  }, []);

  const logWebSocket = useCallback((message: string, meta?: any) => {
    logger.websocket(message, { ...meta, component: 'React Component' });
  }, []);

  const logAPI = useCallback((message: string, meta?: any) => {
    logger.api(message, { ...meta, component: 'React Component' });
  }, []);

  const logAuth = useCallback((message: string, meta?: any) => {
    logger.auth(message, { ...meta, component: 'React Component' });
  }, []);

  const logCall = useCallback((message: string, meta?: any) => {
    logger.call(message, { ...meta, component: 'React Component' });
  }, []);

  const logChat = useCallback((message: string, meta?: any) => {
    logger.chat(message, { ...meta, component: 'React Component' });
  }, []);

  const logPerformance = useCallback((message: string, meta?: any) => {
    logger.performance(message, { ...meta, component: 'React Component' });
  }, []);

  return {
    error: logError,
    warn: logWarning,
    info: logInfo,
    debug: logDebug,
    ui: logUI,
    websocket: logWebSocket,
    api: logAPI,
    auth: logAuth,
    call: logCall,
    chat: logChat,
    performance: logPerformance,
  };
};

/**
 * Hook for creating a component-specific logger with metadata
 */
export const useComponentLogger = (componentName: string) => {
  const componentLogger = logger.child({ component: componentName });
  
  return {
    error: (message: string, meta?: any) => componentLogger.error(message, meta),
    warn: (message: string, meta?: any) => componentLogger.warn(message, meta),
    info: (message: string, meta?: any) => componentLogger.info(message, meta),
    debug: (message: string, meta?: any) => componentLogger.debug(message, meta),
    ui: (message: string, meta?: any) => componentLogger.ui(message, meta),
    websocket: (message: string, meta?: any) => componentLogger.websocket(message, meta),
    api: (message: string, meta?: any) => componentLogger.api(message, meta),
    auth: (message: string, meta?: any) => componentLogger.auth(message, meta),
    call: (message: string, meta?: any) => componentLogger.call(message, meta),
    chat: (message: string, meta?: any) => componentLogger.chat(message, meta),
    performance: (message: string, meta?: any) => componentLogger.performance(message, meta),
  };
};
