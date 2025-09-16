import { ICE_SERVERS } from './constants';

// WebRTC utility functions
export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
  });
};

export const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  try {
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      throw new Error('Camera and microphone access requires HTTPS or localhost');
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    // Request permissions first
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Verify we got the expected tracks
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    
    if (constraints.audio && audioTracks.length === 0) {
      throw new Error('No audio track available');
    }
    
    if (constraints.video && videoTracks.length === 0) {
      throw new Error('No video track available');
    }

    return stream;
  } catch (error: any) {
    console.error('Error accessing media devices:', error);
    
    // Provide more specific error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera and microphone access was denied. Please allow permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera or microphone found. Please check your devices.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera or microphone is already in use by another application.');
    } else if (error.name === 'OverconstrainedError') {
      throw new Error('Camera or microphone constraints cannot be satisfied.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Camera and microphone access is blocked due to security restrictions.');
    } else {
      throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
  }
};

export const getDisplayMedia = async (constraints: DisplayMediaStreamConstraints): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getDisplayMedia(constraints);
  } catch (error) {
    console.error('Error accessing display media:', error);
    throw new Error('Failed to access screen sharing. Please check permissions.');
  }
};

export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    console.log('Stopping media stream with', stream.getTracks().length, 'tracks');
    stream.getTracks().forEach(track => {
      console.log(`Stopping ${track.kind} track:`, track.label);
      track.stop();
      console.log(`Stopped ${track.kind} track`);
    });
    
    // Clear the stream object
    stream.getTracks().forEach(track => {
      stream.removeTrack(track);
    });
  }
};

export const toggleTrack = (stream: MediaStream | null, kind: 'audio' | 'video', enabled: boolean): void => {
  if (stream) {
    const tracks = stream.getTracks().filter(track => track.kind === kind);
    tracks.forEach(track => {
      track.enabled = enabled;
    });
  }
};

export const replaceTrack = (
  peerConnection: RTCPeerConnection,
  stream: MediaStream,
  kind: 'audio' | 'video'
): void => {
  const sender = peerConnection.getSenders().find(s => {
    const track = s.track;
    return track && track.kind === kind;
  });

  if (sender) {
    const newTrack = stream.getTracks().find(track => track.kind === kind);
    if (newTrack) {
      sender.replaceTrack(newTrack);
    }
  }
};

export const isWebRTCSupported = (): boolean => {
  return !!(
    typeof window !== 'undefined' &&
    window.RTCPeerConnection &&
    window.RTCSessionDescription &&
    window.RTCIceCandidate &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

export const isScreenShareSupported = (): boolean => {
  return !!(
    typeof window !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia
  );
};

export const checkMediaPermissions = async (): Promise<{camera: boolean, microphone: boolean}> => {
  try {
    if (!navigator.permissions) {
      return { camera: false, microphone: false };
    }

    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

    return {
      camera: cameraPermission.state === 'granted',
      microphone: microphonePermission.state === 'granted'
    };
  } catch (error) {
    console.warn('Permission API not supported:', error);
    return { camera: false, microphone: false };
  }
};

export const requestMediaPermissions = async (): Promise<boolean> => {
  try {
    // Try to get a minimal stream to trigger permission request
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: { width: 1, height: 1 } 
    });
    
    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Failed to request media permissions:', error);
    return false;
  }
};
