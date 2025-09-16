// Global media cleanup utilities
export const forceStopAllMediaStreams = async (): Promise<void> => {
  console.log('Force stopping all media streams...');
  
  try {
    // Get all active media streams
    const streams = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    console.log('Found active stream, stopping all tracks...');
    streams.getTracks().forEach(track => {
      console.log(`Force stopping ${track.kind} track:`, track.label);
      track.stop();
    });
    
    // Clear the stream
    streams.getTracks().forEach(track => {
      streams.removeTrack(track);
    });
    
    console.log('All media streams force stopped');
  } catch (error) {
    // This is expected if no stream is active
    console.log('No active media streams to stop');
  }
};

export const clearAllVideoElements = (): void => {
  console.log('Clearing all video elements...');
  
  // Find all video elements on the page
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    console.log(`Clearing video element ${index}:`, video);
    video.srcObject = null;
    video.pause();
    video.load(); // Reset the video element
  });
  
  console.log(`Cleared ${videoElements.length} video elements`);
};

export const performGlobalMediaCleanup = async (): Promise<void> => {
  console.log('Performing global media cleanup...');
  
  // Clear all video elements
  clearAllVideoElements();
  
  // Force stop all media streams
  await forceStopAllMediaStreams();
  
  // Force garbage collection
  if (window.gc) {
    window.gc();
  }
  
  console.log('Global media cleanup completed');
};

// Add to window for global access
if (typeof window !== 'undefined') {
  (window as any).forceStopAllMediaStreams = forceStopAllMediaStreams;
  (window as any).clearAllVideoElements = clearAllVideoElements;
  (window as any).performGlobalMediaCleanup = performGlobalMediaCleanup;
}
