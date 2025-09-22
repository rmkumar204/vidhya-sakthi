// Test file to verify browser logger functionality
import { logger } from './logger';

export const testLogger = () => {
  console.log('🧪 Testing Browser Logger...');
  
  // Test different log levels
  logger.error('This is an error message', { errorCode: 500, userId: '123' });
  logger.warn('This is a warning message', { warningType: 'deprecated' });
  logger.info('This is an info message', { action: 'user_login' });
  logger.debug('This is a debug message', { debugInfo: 'detailed_info' });
  
  // Test specialized loggers
  logger.auth('User authentication successful', { userId: '123', method: 'google' });
  logger.call('Call initiated', { callId: 'call_456', type: 'video' });
  logger.chat('Message sent', { messageId: 'msg_789', recipient: 'user_456' });
  logger.websocket('WebSocket connected', { connectionId: 'ws_123' });
  logger.api('API request completed', { endpoint: '/api/users', status: 200 });
  logger.ui('UI component rendered', { component: 'ChatWindow' });
  logger.performance('Performance metric recorded', { metric: 'load_time', value: 150 });
  
  // Test child logger
  const childLogger = logger.child({ userId: '123', sessionId: 'session_456' });
  childLogger.info('Child logger test', { additionalData: 'test' });
  
  console.log('✅ Logger test completed!');
  
  // Export logs for inspection
  const exportedLogs = logger.exportLogs();
  console.log('📋 Exported logs:', exportedLogs);
  
  return {
    success: true,
    message: 'Logger test completed successfully',
    exportedLogs: exportedLogs
  };
};

// Auto-run test in development
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testLogger();
  }, 1000);
}
