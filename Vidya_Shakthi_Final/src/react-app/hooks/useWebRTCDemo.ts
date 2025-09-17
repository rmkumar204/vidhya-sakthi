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

export const useWebRTCDemo = () => {
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

      // Simulate remote participant
      setTimeout(() => {
        console.log('Demo: Audio call connected successfully');
      }, 1000);

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

      // Simulate remote participant
      setTimeout(() => {
        console.log('Demo: Video call connected successfully');
      }, 1000);

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
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (callState.isScreenSharing) {
        // Stop screen sharing and return to camera
        const stream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
        localStreamRef.current = stream;
        setCallState(prev => ({
          ...prev,
          localStream: stream,
          isScreenSharing: false
        }));
      } else {
        // Start screen sharing
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        setCallState(prev => ({
          ...prev,
          isScreenSharing: true
        }));

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
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
