import { useState, useRef, useCallback, useEffect } from 'react';
import { CallState } from '../types';
import { MEDIA_CONSTRAINTS } from '../utils/constants';
import { 
  getUserMedia, 
  getDisplayMedia, 
  stopMediaStream, 
  isWebRTCSupported,
  checkMediaPermissions,
  requestMediaPermissions
} from '../utils/webrtc';
import { performGlobalMediaCleanup } from '../utils/mediaCleanup';

export const useVideoCallFixed = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    connectionStatus: 'disconnected',
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    callDuration: 0,
    error: null,
  });

  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    callId: string;
    callType: 'audio' | 'video';
    roomId?: string;
  } | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');

  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update call duration
  useEffect(() => {
    if (callState.isInCall && callStartTimeRef.current) {
      callDurationIntervalRef.current = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTimeRef.current!.getTime()) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }, 1000);
    } else {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
    }

    return () => {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, [callState.isInCall]);

  const startAudioCall = useCallback(async (participantIds: string[]) => {
    try {
      console.log('Starting audio call with participants:', participantIds);
      
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));
      setCallStatus('connecting');

      // Check if we're in a secure context
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        throw new Error('Audio calls require HTTPS or localhost for security reasons');
      }

      // Check WebRTC support
      if (!isWebRTCSupported()) {
        throw new Error('WebRTC is not supported in this browser');
      }

      // Check permissions first
      const permissions = await checkMediaPermissions();
      if (!permissions.microphone) {
        const granted = await requestMediaPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required for audio calls');
        }
      }

      const stream = await getUserMedia(MEDIA_CONSTRAINTS.AUDIO_CALL);
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'audio',
        participants: participantIds,
        localStream: stream,
        connectionStatus: 'connected',
        isAudioEnabled: true,
        isVideoEnabled: false,
      }));

      callStartTimeRef.current = new Date();
      setCallStatus('connected');

      console.log('Audio call started successfully');

    } catch (error: any) {
      console.error('Error starting audio call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start audio call'
      }));
      setCallStatus('ended');
    }
  }, []);

  const startVideoCall = useCallback(async (participantIds: string[]) => {
    try {
      console.log('Starting video call with participants:', participantIds);
      
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));
      setCallStatus('connecting');

      // Check if we're in a secure context
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        throw new Error('Video calls require HTTPS or localhost for security reasons');
      }

      // Check WebRTC support
      if (!isWebRTCSupported()) {
        throw new Error('WebRTC is not supported in this browser');
      }

      // Check permissions first
      const permissions = await checkMediaPermissions();
      if (!permissions.camera || !permissions.microphone) {
        const granted = await requestMediaPermissions();
        if (!granted) {
          throw new Error('Camera and microphone permissions are required for video calls');
        }
      }

      const stream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'video',
        participants: participantIds,
        localStream: stream,
        connectionStatus: 'connected',
        isAudioEnabled: true,
        isVideoEnabled: true,
      }));

      callStartTimeRef.current = new Date();
      setCallStatus('connected');

      console.log('Video call started successfully');

    } catch (error: any) {
      console.error('Error starting video call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start video call'
      }));
      setCallStatus('ended');
    }
  }, []);

  const acceptCall = useCallback(() => {
    if (incomingCall) {
      setIncomingCall(null);
      setCallStatus('connecting');
      
      // Start the call process
      if (incomingCall.callType === 'video') {
        startVideoCall([incomingCall.from]);
      } else {
        startAudioCall([incomingCall.from]);
      }
    }
  }, [incomingCall, startVideoCall, startAudioCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      setIncomingCall(null);
      setCallStatus('idle');
    }
  }, [incomingCall]);

  const endCall = useCallback(() => {
    console.log('Ending call and cleaning up...');
    
    // Stop local stream
    if (localStreamRef.current) {
      console.log('Stopping local stream...');
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }

    // Reset state
    setCallState({
      isInCall: false,
      callType: null,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      connectionStatus: 'disconnected',
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      callDuration: 0,
      error: null,
    });

    setCallStatus('idle');
    setIncomingCall(null);
    callStartTimeRef.current = null;
    
    // Force garbage collection of media streams
    setTimeout(() => {
      console.log('Call cleanup completed');
    }, 100);
  }, []);

  const forceCleanup = useCallback(async () => {
    console.log('Force cleanup called...');
    
    // Stop all media tracks immediately
    if (localStreamRef.current) {
      console.log('Force stopping local stream tracks...');
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Force stopping ${track.kind} track:`, track.label);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Clear all video elements
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((video, index) => {
      console.log(`Clearing video element ${index}:`, video);
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      video.srcObject = null;
      video.pause();
    });

    // Perform global media cleanup
    await performGlobalMediaCleanup();
    
    // Also call the regular endCall
    endCall();
  }, [endCall]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
        console.log('Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    console.log('toggleVideo called, current state:', {
      hasStream: !!localStreamRef.current,
      isVideoEnabled: callState.isVideoEnabled,
      videoTrack: localStreamRef.current?.getVideoTracks()[0] ? {
        enabled: localStreamRef.current.getVideoTracks()[0].enabled,
        readyState: localStreamRef.current.getVideoTracks()[0].readyState
      } : null
    });

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoTrack && videoTrack.readyState === 'live') {
        // Video track exists and is live - toggle enabled state
        const newEnabledState = !videoTrack.enabled;
        videoTrack.enabled = newEnabledState;
        setCallState(prev => ({ ...prev, isVideoEnabled: newEnabledState }));
        console.log('Video toggled:', newEnabledState ? 'ON' : 'OFF');
      } else if (!videoTrack || videoTrack.readyState === 'ended') {
        // No video track or track is ended - need to re-acquire video
        if (!callState.isVideoEnabled) {
          // Currently not showing video - turn on by getting new stream
          try {
            console.log('Re-acquiring video stream...');
            const newStream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
            
            // Stop old stream if it exists
            if (localStreamRef.current) {
              stopMediaStream(localStreamRef.current);
            }
            
            // Set new stream
            localStreamRef.current = newStream;
            setCallState(prev => ({ 
              ...prev, 
              localStream: newStream,
              isVideoEnabled: true 
            }));
            console.log('Video turned ON (new stream acquired)');
          } catch (error: any) {
            console.error('Failed to re-acquire video stream:', error);
            setCallState(prev => ({ 
              ...prev, 
              error: 'Failed to turn on video. Please check camera permissions.' 
            }));
          }
        } else {
          // Currently showing video but track is missing - turn off
          setCallState(prev => ({ ...prev, isVideoEnabled: false }));
          console.log('Video turned OFF (track missing)');
        }
      }
    } else {
      // No local stream at all - need to get a new one
      if (!callState.isVideoEnabled) {
        try {
          console.log('Acquiring new video stream...');
          const newStream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
          localStreamRef.current = newStream;
          setCallState(prev => ({ 
            ...prev, 
            localStream: newStream,
            isVideoEnabled: true 
          }));
          console.log('Video turned ON (new stream created)');
        } catch (error: any) {
          console.error('Failed to acquire video stream:', error);
          setCallState(prev => ({ 
            ...prev, 
            error: 'Failed to turn on video. Please check camera permissions.' 
          }));
        }
      } else {
        // Stream is missing but state says video is enabled - turn off
        setCallState(prev => ({ ...prev, isVideoEnabled: false }));
        console.log('Video turned OFF (stream missing)');
      }
    }
  }, [callState.isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (callState.isScreenSharing) {
        // Stop screen sharing and return to camera
        console.log('Stopping screen share...');
        const stream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
        localStreamRef.current = stream;
        setCallState(prev => ({
          ...prev,
          localStream: stream,
          isScreenSharing: false
        }));
        console.log('Screen share stopped, camera resumed');
      } else {
        // Start screen sharing
        console.log('Starting screen share...');
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        setCallState(prev => ({
          ...prev,
          isScreenSharing: true
        }));

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('Screen share ended by user');
          toggleScreenShare();
        };
        console.log('Screen share started');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setCallState(prev => ({
        ...prev,
        error: 'Failed to toggle screen sharing'
      }));
    }
  }, [callState.isScreenSharing]);

  return {
    callState,
    incomingCall,
    callStatus,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    forceCleanup,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
};
