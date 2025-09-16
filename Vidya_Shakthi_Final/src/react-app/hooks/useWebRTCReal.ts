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

export const useWebRTCReal = () => {
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

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const userId = 'user-' + Math.random().toString(36).substr(2, 9);
    
    webSocketService.connect(userId).then(() => {
      console.log('WebSocket connected for WebRTC');
    }).catch(error => {
      console.error('WebSocket connection failed:', error);
      setCallState(prev => ({
        ...prev,
        error: 'Failed to connect to signaling server'
      }));
    });

    // Set up event handlers
    webSocketService.on(WS_EVENTS.CALL_INITIATE, handleIncomingCall);
    webSocketService.on(WS_EVENTS.CALL_ACCEPT, handleCallAccepted);
    webSocketService.on(WS_EVENTS.CALL_REJECT, handleCallRejected);
    webSocketService.on(WS_EVENTS.CALL_END, handleCallEnded);
    webSocketService.on(WS_EVENTS.OFFER, handleOffer);
    webSocketService.on(WS_EVENTS.ANSWER, handleAnswer);
    webSocketService.on(WS_EVENTS.ICE_CANDIDATE, handleIceCandidate);

    return () => {
      webSocketService.disconnect();
    };
  }, []);

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

  const handleIncomingCall = useCallback((message: SignalingMessage) => {
    console.log('Incoming call from:', message.from);
    setIncomingCall({
      from: message.from,
      callId: message.callId || '',
      callType: message.data?.callType || 'video',
      roomId: message.data?.roomId
    });
    setCallStatus('ringing');
  }, []);

  const handleCallAccepted = useCallback((message: SignalingMessage) => {
    console.log('Call accepted by:', message.from);
    setCallStatus('connecting');
    // Start creating offer
    createOffer(message.from, message.callId || '');
  }, []);

  const handleCallRejected = useCallback((message: SignalingMessage) => {
    console.log('Call rejected by:', message.from);
    setCallStatus('ended');
    setCallState(prev => ({
      ...prev,
      error: 'Call was rejected'
    }));
    endCall();
  }, []);

  const handleCallEnded = useCallback((message: SignalingMessage) => {
    console.log('Call ended by:', message.from);
    setCallStatus('ended');
    endCall();
  }, []);

  const handleOffer = useCallback(async (message: SignalingMessage) => {
    console.log('Received offer from:', message.from);
    const { offer } = message.data;
    const pc = createPeerConnection();
    peerConnectionsRef.current.set(message.from, pc);

    // Set up event handlers for this peer connection
    setupPeerConnectionEvents(pc, message.from);

    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      webSocketService.sendAnswer(message.from, answer, message.callId || '');
      console.log('Sent answer to:', message.from);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, []);

  const handleAnswer = useCallback(async (message: SignalingMessage) => {
    console.log('Received answer from:', message.from);
    const { answer } = message.data;
    const pc = peerConnectionsRef.current.get(message.from);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
        console.log('Set remote description for:', message.from);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (message: SignalingMessage) => {
    console.log('Received ICE candidate from:', message.from);
    const { candidate } = message.data;
    const pc = peerConnectionsRef.current.get(message.from);
    
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('Added ICE candidate for:', message.from);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  const setupPeerConnectionEvents = useCallback((pc: RTCPeerConnection, participantId: string) => {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', participantId);
        webSocketService.sendIceCandidate(participantId, event.candidate, currentCallIdRef.current || '');
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream from:', participantId);
      const [remoteStream] = event.streams;
      setCallState(prev => ({
        ...prev,
        remoteStreams: new Map(prev.remoteStreams.set(participantId, remoteStream))
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${participantId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        setCallState(prev => ({
          ...prev,
          connectionStatus: 'connected'
        }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCallStatus('ended');
        setCallState(prev => ({
          ...prev,
          connectionStatus: 'disconnected'
        }));
      }
    };
  }, []);

  const createOffer = useCallback(async (participantId: string, callId: string) => {
    const pc = createPeerConnection();
    peerConnectionsRef.current.set(participantId, pc);

    // Set up event handlers
    setupPeerConnectionEvents(pc, participantId);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      webSocketService.sendOffer(participantId, offer, callId);
      console.log('Sent offer to:', participantId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, []);

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
        connectionStatus: 'connecting',
        isAudioEnabled: true,
        isVideoEnabled: false,
      }));

      // Generate call ID and room ID
      const callId = `call_${Date.now()}`;
      const roomId = `room_${Date.now()}`;
      currentCallIdRef.current = callId;
      currentRoomIdRef.current = roomId;

      // Initiate call with first participant
      const targetParticipant = participantIds[0];
      webSocketService.initiateCall(targetParticipant, callId, 'audio');
      setCallStatus('ringing');

      callStartTimeRef.current = new Date();

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
        connectionStatus: 'connecting',
        isAudioEnabled: true,
        isVideoEnabled: true,
      }));

      // Generate call ID and room ID
      const callId = `call_${Date.now()}`;
      const roomId = `room_${Date.now()}`;
      currentCallIdRef.current = callId;
      currentRoomIdRef.current = roomId;

      // Initiate call with first participant
      const targetParticipant = participantIds[0];
      webSocketService.initiateCall(targetParticipant, callId, 'video');
      setCallStatus('ringing');

      callStartTimeRef.current = new Date();

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
      webSocketService.acceptCall(incomingCall.from, incomingCall.callId);
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
      webSocketService.rejectCall(incomingCall.from, incomingCall.callId);
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

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, participantId) => {
      console.log('Closing peer connection for participant:', participantId);
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Notify other participants
    if (currentCallIdRef.current) {
      webSocketService.endCall('', currentCallIdRef.current);
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
    currentCallIdRef.current = null;
    currentRoomIdRef.current = null;
    
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

        // Replace video track in all peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        });
      } else {
        // Start screen sharing
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        setCallState(prev => ({
          ...prev,
          isScreenSharing: true
        }));

        // Replace video track in all peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        });

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
