import { useState, useRef, useCallback, useEffect } from 'react';
import { webSocketService } from '../services/WebSocketService';
import { localStorageService } from '../services/LocalStorageService';

export interface CallState {
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  callId: string | null;
  participants: string[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  error: string | null;
}

export interface IncomingCall {
  callId: string;
  callType: 'audio' | 'video';
  fromUserId: string;
  fromUserName: string;
  timestamp: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  },
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  },
  screenShare: {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 }
    },
    audio: true
  }
};

export const useWebRTC = (userId: string, userName: string) => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    callId: null,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    connectionStatus: 'idle',
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isSpeakerOn: true,
    callDuration: 0,
    error: null
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);

  // Initialize WebSocket event handlers
  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call:', data);
      setIncomingCall({
        callId: data.callId,
        callType: data.callType,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName || 'Unknown User',
        timestamp: new Date().toISOString()
      });
    };

    const handleCallAccepted = (data: any) => {
      console.log('✅ Call accepted:', data);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'connected'
      }));
      startCallTimer();
    };

    const handleCallRejected = (data: any) => {
      console.log('❌ Call rejected:', data);
      endCall();
    };

    const handleCallEnded = (data: any) => {
      console.log('📞 Call ended:', data);
      endCall();
    };

    const handleOffer = async (data: any) => {
      console.log('📨 Received offer:', data);
      await handleIncomingOffer(data);
    };

    const handleAnswer = async (data: any) => {
      console.log('📨 Received answer:', data);
      await handleIncomingAnswer(data);
    };

    const handleIceCandidate = async (data: any) => {
      console.log('🧊 Received ICE candidate:', data);
      await handleIncomingIceCandidate(data);
    };

    // Register event handlers
    webSocketService.on('call_initiate', handleIncomingCall);
    webSocketService.on('call_accept', handleCallAccepted);
    webSocketService.on('call_reject', handleCallRejected);
    webSocketService.on('call_end', handleCallEnded);
    webSocketService.on('offer', handleOffer);
    webSocketService.on('answer', handleAnswer);
    webSocketService.on('ice_candidate', handleIceCandidate);

    return () => {
      webSocketService.off('call_initiate', handleIncomingCall);
      webSocketService.off('call_accept', handleCallAccepted);
      webSocketService.off('call_reject', handleCallRejected);
      webSocketService.off('call_end', handleCallEnded);
      webSocketService.off('offer', handleOffer);
      webSocketService.off('answer', handleAnswer);
      webSocketService.off('ice_candidate', handleIceCandidate);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, []);

  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && currentCallIdRef.current) {
        webSocketService.sendIceCandidate(targetUserId, currentCallIdRef.current, event.candidate);
      }
    };

    // Handle remote streams
    peerConnection.ontrack = (event) => {
      console.log('📹 Remote stream received:', event);
      const [remoteStream] = event.streams;
      setCallState(prev => ({
        ...prev,
        remoteStreams: new Map(prev.remoteStreams.set(targetUserId, remoteStream))
      }));
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, connectionStatus: 'connected' }));
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setCallState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      }
    };

    peerConnections.current.set(targetUserId, peerConnection);
    return peerConnection;
  }, []);

  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      throw new Error(`Failed to access media devices: ${error.message}`);
    }
  }, []);

  const getDisplayMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(MEDIA_CONSTRAINTS.screenShare);
      return stream;
    } catch (error: any) {
      console.error('Error accessing display media:', error);
      throw new Error(`Failed to access screen sharing: ${error.message}`);
    }
  }, []);

  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = new Date();
    callDurationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }
    }, 1000);
  }, []);

  const initiateCall = useCallback(async (targetUserId: string, callType: 'audio' | 'video') => {
    try {
      setCallState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

      // Get media stream
      const constraints = callType === 'video' 
        ? { ...MEDIA_CONSTRAINTS.audio, ...MEDIA_CONSTRAINTS.video }
        : MEDIA_CONSTRAINTS.audio;

      const stream = await getUserMedia(constraints);
      localStreamRef.current = stream;

      // Create call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentCallIdRef.current = callId;

      // Create peer connection
      const peerConnection = createPeerConnection(targetUserId);
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      webSocketService.sendOffer(targetUserId, callId, offer);

      // Update call state
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType,
        callId,
        participants: [targetUserId],
        localStream: stream,
        connectionStatus: 'connecting'
      }));

      // Log call start
      localStorageService.saveMessage({
        id: `call_start_${callId}`,
        chatId: `chat_${targetUserId}`,
        senderId: userId,
        senderName: userName,
        content: `Started ${callType} call`,
        timestamp: new Date().toISOString(),
        messageType: 'call_started',
        callMetadata: {
          callId,
          callType,
          participants: [userId, targetUserId]
        }
      });

    } catch (error: any) {
      console.error('Error initiating call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: error.message
      }));
    }
  }, [userId, userName, getUserMedia, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setCallState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

      // Get media stream
      const constraints = incomingCall.callType === 'video' 
        ? { ...MEDIA_CONSTRAINTS.audio, ...MEDIA_CONSTRAINTS.video }
        : MEDIA_CONSTRAINTS.audio;

      const stream = await getUserMedia(constraints);
      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = createPeerConnection(incomingCall.fromUserId);
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Accept the call
      webSocketService.acceptCall(incomingCall.callId, incomingCall.fromUserId);

      // Update call state
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: incomingCall.callType,
        callId: incomingCall.callId,
        participants: [incomingCall.fromUserId],
        localStream: stream,
        connectionStatus: 'connecting'
      }));

      currentCallIdRef.current = incomingCall.callId;
      setIncomingCall(null);

      // Log call acceptance
      localStorageService.saveMessage({
        id: `call_accept_${incomingCall.callId}`,
        chatId: `chat_${incomingCall.fromUserId}`,
        senderId: userId,
        senderName: userName,
        content: `Accepted ${incomingCall.callType} call`,
        timestamp: new Date().toISOString(),
        messageType: 'call_started',
        callMetadata: {
          callId: incomingCall.callId,
          callType: incomingCall.callType,
          participants: [userId, incomingCall.fromUserId]
        }
      });

    } catch (error: any) {
      console.error('Error accepting call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: error.message
      }));
    }
  }, [incomingCall, userId, userName, getUserMedia, createPeerConnection]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    webSocketService.rejectCall(incomingCall.callId, incomingCall.fromUserId);
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (currentCallIdRef.current) {
      // Notify other participants
      callState.participants.forEach(participantId => {
        if (participantId !== userId) {
          webSocketService.endCall(currentCallIdRef.current!, participantId);
        }
      });

      // Log call end
      const callDuration = callStartTimeRef.current 
        ? Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000)
        : 0;

      localStorageService.saveMessage({
        id: `call_end_${currentCallIdRef.current}`,
        chatId: `chat_${callState.participants.find(p => p !== userId) || 'unknown'}`,
        senderId: userId,
        senderName: userName,
        content: `Ended call (${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')})`,
        timestamp: new Date().toISOString(),
        messageType: 'call_ended',
        callMetadata: {
          callId: currentCallIdRef.current,
          callType: callState.callType || 'audio',
          duration: callDuration,
          participants: callState.participants
        }
      });
    }

    // Cleanup
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      screenShareStreamRef.current = null;
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }

    setCallState({
      isInCall: false,
      callType: null,
      callId: null,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      connectionStatus: 'idle',
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      isSpeakerOn: true,
      callDuration: 0,
      error: null
    });

    currentCallIdRef.current = null;
    callStartTimeRef.current = null;
  }, [callState, userId, userName]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
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

        setCallState(prev => ({ ...prev, isScreenSharing: false }));

        // Log screen share end
        localStorageService.saveMessage({
          id: `screen_share_end_${Date.now()}`,
          chatId: `chat_${callState.participants.find(p => p !== userId) || 'unknown'}`,
          senderId: userId,
          senderName: userName,
          content: 'Stopped screen sharing',
          timestamp: new Date().toISOString(),
          messageType: 'screen_share_ended'
        });

      } else {
        // Start screen sharing
        const screenStream = await getDisplayMedia();
        screenShareStreamRef.current = screenStream;

        // Replace video track with screen share
        if (localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            localStreamRef.current.addTrack(videoTrack);
          }
        }

        setCallState(prev => ({ ...prev, isScreenSharing: true }));

        // Log screen share start
        localStorageService.saveMessage({
          id: `screen_share_start_${Date.now()}`,
          chatId: `chat_${callState.participants.find(p => p !== userId) || 'unknown'}`,
          senderId: userId,
          senderName: userName,
          content: 'Started screen sharing',
          timestamp: new Date().toISOString(),
          messageType: 'screen_share_started'
        });

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
      setCallState(prev => ({ ...prev, error: error.message }));
    }
  }, [callState, userId, userName, getDisplayMedia]);

  // WebRTC event handlers
  const handleIncomingOffer = useCallback(async (data: any) => {
    try {
      const peerConnection = createPeerConnection(data.fromUserId);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      webSocketService.sendAnswer(data.fromUserId, data.callId, answer);
    } catch (error) {
      console.error('Error handling incoming offer:', error);
    }
  }, [createPeerConnection]);

  const handleIncomingAnswer = useCallback(async (data: any) => {
    try {
      const peerConnection = peerConnections.current.get(data.fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    } catch (error) {
      console.error('Error handling incoming answer:', error);
    }
  }, []);

  const handleIncomingIceCandidate = useCallback(async (data: any) => {
    try {
      const peerConnection = peerConnections.current.get(data.fromUserId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling incoming ICE candidate:', error);
    }
  }, []);

  return {
    callState,
    incomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};