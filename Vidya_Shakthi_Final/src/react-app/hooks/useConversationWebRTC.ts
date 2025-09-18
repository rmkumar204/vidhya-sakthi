import { useState, useRef, useCallback, useEffect } from 'react';
import { CallState, SignalingMessage } from '../types';
import { MEDIA_CONSTRAINTS, WS_EVENTS } from '../utils/constants';
import { 
  getUserMedia, 
  getDisplayMedia, 
  isWebRTCSupported,
  checkMediaPermissions,
  requestMediaPermissions
} from '../utils/webrtc';
import { performGlobalMediaCleanup } from '../utils/mediaCleanup';
import { webSocketService } from '../services/WebSocketService';
import { 
  RealTimeConversationService,
  logCallStart,
  logCallEnd,
  logScreenShareStart,
  logScreenShareEnd
} from '../services/ConversationService';

export interface ConversationCallState extends CallState {
  conversationId: string;
  otherParticipant: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export const useConversationWebRTC = (
  conversationId: string,
  otherParticipant: any,
  token: string,
  userId: string
) => {
  const [callState, setCallState] = useState<ConversationCallState>({
    isInCall: false,
    callType: null,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    connectionStatus: 'disconnected',
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isSpeakerOn: true,
    callDuration: 0,
    error: null,
    conversationId,
    otherParticipant
  });

  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    callId: string;
    callType: 'audio' | 'video';
    roomId?: string;
  } | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const realTimeServiceRef = useRef<RealTimeConversationService | null>(null);

  // Initialize WebSocket connection and real-time service
  useEffect(() => {
    if (conversationId && token && userId) {
      realTimeServiceRef.current = new RealTimeConversationService(token, userId);
      
      realTimeServiceRef.current.connect(conversationId).then(() => {
        console.log('Real-time conversation service connected');
      }).catch(console.error);

      // Set up WebSocket event handlers
      webSocketService.on(WS_EVENTS.CALL_INITIATE, handleIncomingCall);
      webSocketService.on(WS_EVENTS.CALL_ACCEPT, handleCallAccepted);
      webSocketService.on(WS_EVENTS.CALL_REJECT, handleCallRejected);
      webSocketService.on(WS_EVENTS.CALL_END, handleCallEnded);
      webSocketService.on(WS_EVENTS.OFFER, handleOffer);
      webSocketService.on(WS_EVENTS.ANSWER, handleAnswer);
      webSocketService.on(WS_EVENTS.ICE_CANDIDATE, handleIceCandidate);

      return () => {
        webSocketService.off(WS_EVENTS.CALL_INITIATE, handleIncomingCall);
        webSocketService.off(WS_EVENTS.CALL_ACCEPT, handleCallAccepted);
        webSocketService.off(WS_EVENTS.CALL_REJECT, handleCallRejected);
        webSocketService.off(WS_EVENTS.CALL_END, handleCallEnded);
        webSocketService.off(WS_EVENTS.OFFER, handleOffer);
        webSocketService.off(WS_EVENTS.ANSWER, handleAnswer);
        webSocketService.off(WS_EVENTS.ICE_CANDIDATE, handleIceCandidate);
        
        if (realTimeServiceRef.current) {
          realTimeServiceRef.current.disconnect();
        }
      };
    }
  }, [conversationId, token, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      performGlobalMediaCleanup();
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, []);


  const startAudioCall = useCallback(async () => {
    try {
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));
      setCallStatus('connecting');

      // Check WebRTC support
      if (!isWebRTCSupported()) {
        throw new Error('WebRTC is not supported in this browser');
      }

      // Check permissions
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
        participants: [otherParticipant._id],
        localStream: stream,
        connectionStatus: 'connecting',
        isAudioEnabled: true,
        isVideoEnabled: false,
      }));

      // Generate call ID and room ID
      const callId = `call_${Date.now()}`;
      const roomId = `room_${Date.now()}`;
      currentCallIdRef.current = callId;
      currentRoomIdRef.current = roomId;

      // Log call start
      await logCallStart(conversationId, {
        callId,
        callType: 'audio',
        participants: [userId, otherParticipant._id],
        startTime: new Date().toISOString()
      }, token);

      // Initiate call
      webSocketService.initiateCall(otherParticipant._id, callId, 'audio');
      setCallStatus('ringing');

    } catch (error: any) {
      console.error('Error starting audio call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start audio call'
      }));
      setCallStatus('ended');
    }
  }, [conversationId, otherParticipant._id, userId, token]);

  const startVideoCall = useCallback(async () => {
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

      // Check permissions
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
        participants: [otherParticipant._id],
        localStream: stream,
        connectionStatus: 'connecting',
        isAudioEnabled: true,
        isVideoEnabled: true,
      }));

      // Generate call ID and room ID
      const callId = `call_${Date.now()}`;
      const roomId = `room_${Date.now()}`;
      currentCallIdRef.current = callId;
      currentRoomIdRef.current = roomId;

      // Log call start
      await logCallStart(conversationId, {
        callId,
        callType: 'video',
        participants: [userId, otherParticipant._id],
        startTime: new Date().toISOString()
      }, token);

      // Initiate call
      webSocketService.initiateCall(otherParticipant._id, callId, 'video');
      setCallStatus('ringing');

    } catch (error: any) {
      console.error('Error starting video call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start video call'
      }));
      setCallStatus('ended');
    }
  }, [conversationId, otherParticipant._id, userId, token]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setCallStatus('connecting');

      // Get media stream based on call type
      const stream = await getUserMedia(
        incomingCall.callType === 'video' 
          ? MEDIA_CONSTRAINTS.VIDEO_CALL 
          : MEDIA_CONSTRAINTS.AUDIO_CALL
      );
      
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: incomingCall.callType,
        participants: [incomingCall.from],
        localStream: stream,
        connectionStatus: 'connecting',
        isAudioEnabled: true,
        isVideoEnabled: incomingCall.callType === 'video',
      }));

      // Accept the call
      webSocketService.acceptCall(incomingCall.from, incomingCall.callId);
      
      // Log call start
      await logCallStart(conversationId, {
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        participants: [userId, incomingCall.from],
        startTime: new Date().toISOString()
      }, token);

      setIncomingCall(null);

    } catch (error: any) {
      console.error('Error accepting call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to accept call'
      }));
      setCallStatus('ended');
    }
  }, [incomingCall, conversationId, userId, token]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    webSocketService.rejectCall(incomingCall.from, incomingCall.callId);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall]);

  const endCall = useCallback(async () => {
    if (!currentCallIdRef.current) return;

    try {
      // Log call end
      const callDuration = callStartTimeRef.current 
        ? Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000)
        : 0;

      await logCallEnd(conversationId, {
        callId: currentCallIdRef.current,
        callType: callState.callType || 'audio',
        participants: [userId, otherParticipant._id],
        startTime: callStartTimeRef.current?.toISOString() || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: callDuration
      }, token);

      // End the call
      webSocketService.endCall(otherParticipant._id, currentCallIdRef.current);

      // Cleanup
      performGlobalMediaCleanup();
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }

      setCallState(prev => ({
        ...prev,
        isInCall: false,
        callType: null,
        participants: [],
        localStream: null,
        remoteStreams: new Map(),
        connectionStatus: 'disconnected',
        isScreenSharing: false,
        callDuration: 0,
        error: null
      }));

      setCallStatus('ended');
      currentCallIdRef.current = null;
      currentRoomIdRef.current = null;
      callStartTimeRef.current = null;

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [conversationId, callState.callType, userId, otherParticipant?._id, token]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isAudioEnabled: !prev.isAudioEnabled
        }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isVideoEnabled: !prev.isVideoEnabled
        }));
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (callState.isScreenSharing) {
        // Stop screen sharing
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach(track => track.stop());
          screenShareStreamRef.current = null;
        }

        // Switch back to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = true;
          }
        }

        setCallState(prev => ({
          ...prev,
          isScreenSharing: false
        }));

        // Log screen share end
        await logScreenShareEnd(conversationId, token);

      } else {
        // Start screen sharing
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        screenShareStreamRef.current = screenStream;

        // Replace video track with screen share
        if (localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            // Add the screen share track to the local stream
            localStreamRef.current.addTrack(videoTrack);
          }
        }

        setCallState(prev => ({
          ...prev,
          isScreenSharing: true
        }));

        // Log screen share start
        await logScreenShareStart(conversationId, token);

        // Handle when user stops sharing via browser UI
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            toggleScreenShare();
          });
        }
      }
    } catch (error: any) {
      console.error('Error toggling screen share:', error);
      setCallState(prev => ({
        ...prev,
        error: error.message || 'Failed to toggle screen share'
      }));
    }
  }, [callState.isScreenSharing, conversationId, token]);

  // WebSocket event handlers
  const handleIncomingCall = useCallback((message: SignalingMessage) => {
    if (message.type === WS_EVENTS.CALL_INITIATE) {
      setIncomingCall({
        from: message.from,
        callId: message.callId || '',
        callType: message.data?.callType || 'audio',
        roomId: message.data?.roomId || undefined
      });
      setCallStatus('ringing');
    }
  }, []);

  const handleCallAccepted = useCallback((message: SignalingMessage) => {
    if (message.type === WS_EVENTS.CALL_ACCEPT) {
      setCallStatus('connected');
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'connected'
      }));
      
      callStartTimeRef.current = new Date();
      
      // Start call duration timer
      callDurationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
          setCallState(prev => ({
            ...prev,
            callDuration: duration
          }));
        }
      }, 1000);
    }
  }, []);

  const handleCallRejected = useCallback((message: SignalingMessage) => {
    if (message.type === WS_EVENTS.CALL_REJECT) {
      setCallStatus('ended');
      setCallState(prev => ({
        ...prev,
        isInCall: false,
        connectionStatus: 'disconnected',
        error: 'Call was rejected'
      }));
    }
  }, []);

  const handleCallEnded = useCallback((message: SignalingMessage) => {
    if (message.type === WS_EVENTS.CALL_END) {
      endCall();
    }
  }, [endCall]);

  const handleOffer = useCallback((message: SignalingMessage) => {
    // Handle WebRTC offer
    console.log('Received offer:', message);
  }, []);

  const handleAnswer = useCallback((message: SignalingMessage) => {
    // Handle WebRTC answer
    console.log('Received answer:', message);
  }, []);

  const handleIceCandidate = useCallback((message: SignalingMessage) => {
    // Handle ICE candidate
    console.log('Received ICE candidate:', message);
  }, []);

  return {
    callState,
    incomingCall,
    callStatus,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};
