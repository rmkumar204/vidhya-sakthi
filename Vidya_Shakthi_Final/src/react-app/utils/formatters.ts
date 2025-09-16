// Duration formatting utility
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Time formatting utility
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Call status formatting
export const formatCallStatus = (status: string): string => {
  switch (status) {
    case 'initiating':
      return 'Initiating...';
    case 'ringing':
      return 'Ringing...';
    case 'connected':
      return 'Connected';
    case 'ended':
      return 'Call Ended';
    case 'failed':
      return 'Call Failed';
    default:
      return 'Unknown';
  }
};

// Connection status formatting
export const formatConnectionStatus = (status: string): string => {
  switch (status) {
    case 'connecting':
      return 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
};
