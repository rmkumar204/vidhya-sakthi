import { useState, useRef, useCallback, useEffect } from 'react';
import { CallState, SignalingMessage } from '../types';
import { MEDIA_CONSTRAINTS, WS_EVENTS } from '../utils/constants';
import { 
  createPeerConnection, 
  getUserMedia, 
  getDisplayMedia, 
  stopMediaStream, 
  toggleTrack, 
  replaceTrack,
  isWebRTCSupported,
  checkMediaPermissions,
  requestMediaPermissions
} from '../utils/webrtc';
import { performGlobalMediaCleanup } from '../utils/mediaCleanup';
import { webSocketService } from '../services/WebSocketService';

export const useWebRTC = () => {
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

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection (commented out for demo - no actual server)
  useEffect(() => {
    if (isWebRTCSupported()) {
      // For demo purposes, we'll simulate the connection
      console.log('WebRTC is supported, ready for calls');
      
      // Set up event handlers (for when signaling server is available)
      // webSocketService.on(WS_EVENTS.CALL_INITIATE, handleIncomingCall);
      // webSocketService.on(WS_EVENTS.CALL_ACCEPT, handleCallAccepted);
      // webSocketService.on(WS_EVENTS.CALL_REJECT, handleCallRejected);
      // webSocketService.on(WS_EVENTS.CALL_END, handleCallEnded);
      // webSocketService.on(WS_EVENTS.OFFER, handleOffer);
      // webSocketService.on(WS_EVENTS.ANSWER, handleAnswer);
      // webSocketService.on(WS_EVENTS.ICE_CANDIDATE, handleIceCandidate);

      return () => {
        // webSocketService.disconnect();
      };
    } else {
      setCallState(prev => ({ 
        ...prev, 
        error: 'WebRTC is not supported in this browser' 
      }));
    }
  }, []);

  // Call duration timer
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
        // Try to request permissions
        const granted = await requestMediaPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required for audio calls');
        }
      }

      const stream = await getUserMedia(MEDIA_CONSTRAINTS.AUDIO_ONLY);
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

      // For demo purposes, simulate a successful connection
      console.log('Audio call started successfully');
      
      // Simulate incoming audio for testing
      setTimeout(() => {
        console.log('Simulating incoming audio...');
        // In a real app, this would be handled by the signaling server
      }, 2000);

    } catch (error: any) {
      console.error('Error starting audio call:', error);
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start audio call. Please check microphone permissions.'
      }));
    }
  }, []);

  const startVideoCall = useCallback(async (participantIds: string[]) => {
    try {
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));

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
        // Try to request permissions
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

      // For demo purposes, simulate a successful connection
      console.log('Video call started successfully');
      
      // Simulate remote stream after a delay for demo
      setTimeout(() => {
        console.log('Simulating remote video connection...');
        // In a real app, this would be handled by the signaling server
      }, 2000);

    } catch (error: any) {
      console.error('Error starting video call:', error);
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start video call. Please check camera and microphone permissions.'
      }));
    }
  }, []);

  const endCall = useCallback(() => {
    console.log('Ending call and cleaning up...');
    
    // Stop local stream
    if (localStreamRef.current) {
      console.log('Stopping local stream...');
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, participantId) => {
      console.log('Closing peer connection for participant:', participantId);
      pc.close();
      // webSocketService.endCall(participantId, `call_${Date.now()}`);
    });
    peerConnectionsRef.current.clear();

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

    callStartTimeRef.current = null;
    
    // Force garbage collection of media streams
    setTimeout(() => {
      console.log('Call cleanup completed');
    }, 100);
  }, []);

  // Add a global cleanup function that can be called from anywhere
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

  const toggleVideo = useCallback(async () => {
    if (!callState.isVideoEnabled) {
      // Turning video back on
      try {
        const newStream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
        const existingAudioTrack = localStreamRef.current?.getAudioTracks()[0];
        
        if (existingAudioTrack) {
          newStream.addTrack(existingAudioTrack);
        }

        if (localStreamRef.current) {
          stopMediaStream(localStreamRef.current);
        }

        localStreamRef.current = newStream;
        setCallState(prev => ({ 
          ...prev, 
          localStream: newStream, 
          isVideoEnabled: true 
        }));

      } catch (error) {
        console.error('Error turning video back on:', error);
      }
    } else {
      // Turning video off
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          setCallState(prev => ({ 
            ...prev, 
            isVideoEnabled: false 
          }));
        }
      }
    }
  }, [callState.isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!callState.isScreenSharing) {
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        
        if (localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          
          const newStream = new MediaStream();
          if (videoTrack) newStream.addTrack(videoTrack);
          if (audioTrack) newStream.addTrack(audioTrack);
          
          localStreamRef.current = newStream;
          setCallState(prev => ({ 
            ...prev, 
            localStream: newStream, 
            isScreenSharing: true 
          }));
        }

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setCallState(prev => ({ ...prev, isScreenSharing: false }));
          // Turn video back on
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = true;
              setCallState(prev => ({ ...prev, isVideoEnabled: true }));
            }
          }
        };
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, [callState.isScreenSharing]);

  // Peer connection functions (commented out for demo - would be used with actual signaling server)
  // const createPeerConnectionForParticipant = async (participantId: string, stream: MediaStream) => {
  //   const pc = createPeerConnection();
  //   peerConnectionsRef.current.set(participantId, pc);
  //   // ... implementation for real peer connections
  // };

  // WebSocket event handlers (commented out for demo)
  // const handleIncomingCall = useCallback((message: SignalingMessage) => {
  //   console.log('Incoming call:', message);
  // }, []);

  // const handleCallAccepted = useCallback((message: SignalingMessage) => {
  //   console.log('Call accepted:', message);
  // }, []);

  // const handleCallRejected = useCallback((message: SignalingMessage) => {
  //   console.log('Call rejected:', message);
  //   endCall();
  // }, [endCall]);

  // const handleCallEnded = useCallback((message: SignalingMessage) => {
  //   console.log('Call ended:', message);
  //   endCall();
  // }, [endCall]);

  // const handleOffer = useCallback(async (message: SignalingMessage) => {
  //   const { offer } = message.data;
  //   const pc = createPeerConnection();
  //   await pc.setRemoteDescription(offer);
  //   const answer = await pc.createAnswer();
  //   await pc.setLocalDescription(answer);
  //   webSocketService.sendAnswer(message.from, answer, message.callId || '');
  // }, []);

  // const handleAnswer = useCallback(async (message: SignalingMessage) => {
  //   const { answer } = message.data;
  //   const pc = peerConnectionsRef.current.get(message.from);
  //   if (pc) {
  //     await pc.setRemoteDescription(answer);
  //   }
  // }, []);

  // const handleIceCandidate = useCallback(async (message: SignalingMessage) => {
  //   const { candidate } = message.data;
  //   const pc = peerConnectionsRef.current.get(message.from);
  //   if (pc) {
  //     await pc.addIceCandidate(candidate);
  //   }
  // }, []);

  return {
    callState,
    startAudioCall,
    startVideoCall,
    endCall,
    forceCleanup,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
};
