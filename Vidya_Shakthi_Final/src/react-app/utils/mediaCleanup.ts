import { logger } from '../utils/logger';

// Global media cleanup utilities
export const forceStopAllMediaStreams = async (): Promise<void> => {
  logger.info('Force stopping all media streams...');
  
  try {
    // Get all active media streams
    const streams = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    logger.info('Found active stream, stopping all tracks...');
    streams.getTracks().forEach(track => {
      logger.info(`Force stopping ${track.kind} track:`, track.label);
      track.stop();
    });
    
    // Clear the stream
    streams.getTracks().forEach(track => {
      streams.removeTrack(track);
    });
    
    logger.info('All media streams force stopped');
  } catch (error) {
    // This is expected if no stream is active
    logger.info('No active media streams to stop');
  }
};

export const clearAllVideoElements = (): void => {
  logger.info('Clearing all video elements...');
  
  // Find all video elements on the page
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    logger.info(`Clearing video element ${index}:`, video);
    video.srcObject = null;
    video.pause();
    video.load(); // Reset the video element
  });
  
  logger.info(`Cleared ${videoElements.length} video elements`);
};

export const performGlobalMediaCleanup = async (): Promise<void> => {
  logger.info('Performing global media cleanup...');
  
  // Clear all video elements
  clearAllVideoElements();
  
  // Force stop all media streams
  await forceStopAllMediaStreams();
  
  // Force garbage collection
  if (window.gc) {
    window.gc();
  }
  
  logger.info('Global media cleanup completed');
};

// Add to window for global access
if (typeof window !== 'undefined') {
  (window as any).forceStopAllMediaStreams = forceStopAllMediaStreams;
  (window as any).clearAllVideoElements = clearAllVideoElements;
  (window as any).performGlobalMediaCleanup = performGlobalMediaCleanup;
}
