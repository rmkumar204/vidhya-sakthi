import { useState, useCallback, useEffect, useRef } from 'react';
import { webRTCService, Call, CallState } from '@/react-app/services/WebRTCService';
import { webSocketService } from '@/react-app/services/WebSocketService';

export interface IncomingCall {
  callId: string;
  fromUserId: string;
  fromUserName: string;
  callType: 'video' | 'audio';
  timestamp: string;
}

export interface CallHistoryEntry {
  id: string;
  type: 'video' | 'audio';
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'missed' | 'declined' | 'failed';
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CallSignalingState {
  call: Call | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isHandlingCallEnd: boolean;
  incomingCall: IncomingCall | null;
  callState: CallState;
  callHistory: CallHistoryEntry[];
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isReconnecting: boolean;
}

export const useCallSignaling = (userId: string, userName: string) => {
  const [state, setState] = useState<CallSignalingState>({
    call: null,
    localStream: null,
    remoteStream: null,
    isHandlingCallEnd: false,
    incomingCall: null,
    callState: webRTCService.getCallState(),
    callHistory: [],
    connectionQuality: 'poor',
    isReconnecting: false
  });

  const callEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    webRTCService.initialize(userId);
  }, [userId]);

  // Setup WebRTC event listeners
  useEffect(() => {
    const handleCallStateChanged = (callState: CallState) => {
      setState(prev => ({
        ...prev,
        callState,
        localStream: callState.localStream,
        remoteStream: callState.remoteStream,
        connectionQuality: callState.connectionQuality,
        isReconnecting: callState.connectionStatus === 'reconnecting'
      }));
    };

    const handleCallEnded = (data: { callId: string; duration: number; callType: 'video' | 'audio' }) => {
      // Add to call history
      const callHistoryEntry: CallHistoryEntry = {
        id: data.callId,
        type: data.callType,
        fromUserId: state.call?.fromUserId || '',
        toUserId: state.call?.toUserId || '',
        fromUserName: state.call?.fromUserId === userId ? userName : 'Unknown',
        toUserName: state.call?.toUserId === userId ? userName : 'Unknown',
        startTime: state.call?.startTime || new Date(),
        endTime: new Date(),
        duration: data.duration,
        status: 'completed',
        connectionQuality: state.connectionQuality
      };

      setState(prev => ({
        ...prev,
        call: null,
        localStream: null,
        remoteStream: null,
        isHandlingCallEnd: false,
        callHistory: [...prev.callHistory, callHistoryEntry]
      }));

      // Generate call history message for chat
      const callHistoryMessage = {
        type: 'call_history',
        callId: data.callId,
        duration: data.duration,
        callType: data.callType,
        timestamp: new Date().toISOString()
      };

      // Send call history via WebSocket
      webSocketService.sendMessage('call_history', callHistoryMessage);
    };

    const handleConnectionFailed = () => {
      setState(prev => ({
        ...prev,
        call: null,
        localStream: null,
        remoteStream: null,
        isHandlingCallEnd: false
      }));
    };

    // WebRTC service event listeners
    webRTCService.on('call_state_changed', handleCallStateChanged);
    webRTCService.on('call_ended', handleCallEnded);
    webRTCService.on('connection_failed', handleConnectionFailed);

    return () => {
      webRTCService.off('call_state_changed', handleCallStateChanged);
      webRTCService.off('call_ended', handleCallEnded);
      webRTCService.off('connection_failed', handleConnectionFailed);
    };
  }, []);

  // Setup WebSocket event listeners for call signaling
  useEffect(() => {
    const handleCallOffer = (data: {
      callId: string;
      fromUserId: string;
      fromUserName: string;
      offer: RTCSessionDescriptionInit;
      callType: 'video' | 'audio';
      timestamp: string;
    }) => {
      console.log('📞 Incoming call offer:', data);
      
      setState(prev => ({
        ...prev,
        incomingCall: {
          callId: data.callId,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          callType: data.callType,
          timestamp: data.timestamp
        }
      }));

      // Store offer for later use
      (window as any).pendingCallOffer = data;
    };

    const handleCallAnswer = (data: {
      callId: string;
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log('📞 Call answer received:', data);
      webRTCService.handleCallAnswer(data.answer);
    };

    const handleCallReject = (data: {
      callId: string;
      fromUserId: string;
    }) => {
      console.log('📞 Call rejected:', data);
      setState(prev => ({
        ...prev,
        call: null,
        localStream: null,
        remoteStream: null,
        isHandlingCallEnd: false
      }));
    };

    const handleCallEnd = (data: {
      callId: string;
      fromUserId: string;
    }) => {
      console.log('📞 Call ended by remote user:', data);
      if (state.call?.id === data.callId) {
        webRTCService.endCall();
      }
    };

    const handleIceCandidate = (data: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      console.log('🧊 ICE candidate received:', data);
      webRTCService.handleIceCandidate(data.candidate);
    };

    const handleCallInitiated = (data: {
      callId: string;
      toUserId: string;
      offer: RTCSessionDescriptionInit;
      callType: 'video' | 'audio';
    }) => {
      console.log('📞 Call initiated, sending offer:', data);
      webSocketService.sendMessage('call_offer', {
        callId: data.callId,
        toUserId: data.toUserId,
        fromUserId: userId,
        fromUserName: userName,
        offer: data.offer,
        callType: data.callType,
        timestamp: new Date().toISOString()
      }, data.toUserId);
    };

    const handleCallAccepted = (data: {
      callId: string;
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log('📞 Call accepted, sending answer:', data);
      webSocketService.sendMessage('call_answer', {
        callId: data.callId,
        toUserId: data.fromUserId,
        fromUserId: userId,
        answer: data.answer
      }, data.fromUserId);
    };

    const handleCallRejected = (data: {
      callId: string;
      fromUserId: string;
    }) => {
      console.log('📞 Call rejected, notifying remote user:', data);
      webSocketService.sendMessage('call_reject', {
        callId: data.callId,
        toUserId: data.fromUserId,
        fromUserId: userId
      }, data.fromUserId);
    };

    const handleIceCandidateEmit = (data: {
      candidate: RTCIceCandidateInit;
      toUserId: string;
    }) => {
      console.log('🧊 Sending ICE candidate:', data);
      webSocketService.sendMessage('ice_candidate', {
        toUserId: data.toUserId,
        fromUserId: userId,
        candidate: data.candidate
      }, data.toUserId);
    };

    const handleCallEndedEmit = (data: {
      callId: string;
      duration: number;
      callType: 'video' | 'audio';
    }) => {
      console.log('📞 Call ended, notifying remote user:', data);
      if (state.call) {
        webSocketService.sendMessage('call_end', {
          callId: data.callId,
          toUserId: state.call.toUserId,
          fromUserId: userId
        }, state.call.toUserId);
      }
    };

    // WebRTC service event listeners
    webRTCService.on('call_initiated', handleCallInitiated);
    webRTCService.on('call_accepted', handleCallAccepted);
    webRTCService.on('call_rejected', handleCallRejected);
    webRTCService.on('ice_candidate', handleIceCandidateEmit);
    webRTCService.on('call_ended', handleCallEndedEmit);

    // WebSocket event listeners
    webSocketService.on('call_offer', handleCallOffer);
    webSocketService.on('call_answer', handleCallAnswer);
    webSocketService.on('call_reject', handleCallReject);
    webSocketService.on('call_rejected', handleCallReject); // Handle call_rejected from server
    webSocketService.on('call_end', handleCallEnd);
    webSocketService.on('ice_candidate', handleIceCandidate);

    return () => {
      // Cleanup WebRTC service listeners
      webRTCService.off('call_initiated', handleCallInitiated);
      webRTCService.off('call_accepted', handleCallAccepted);
      webRTCService.off('call_rejected', handleCallRejected);
      webRTCService.off('ice_candidate', handleIceCandidateEmit);
      webRTCService.off('call_ended', handleCallEndedEmit);

      // Cleanup WebSocket listeners
      webSocketService.off('call_offer', handleCallOffer);
      webSocketService.off('call_answer', handleCallAnswer);
      webSocketService.off('call_reject', handleCallReject);
      webSocketService.off('call_rejected', handleCallReject); // Cleanup call_rejected listener
      webSocketService.off('call_end', handleCallEnd);
      webSocketService.off('ice_candidate', handleIceCandidate);
    };
  }, [userId, userName, state.call]);

  // Call functions
  const initiateCall = useCallback(async (toUserId: string, callType: 'video' | 'audio') => {
    try {
      setState(prev => ({ ...prev, isHandlingCallEnd: false }));

      await webRTCService.initiateCall(
        toUserId,
        callType,
        (remoteStream) => {
          setState(prev => ({ ...prev, remoteStream }));
        },
        () => {
          setState(prev => ({ ...prev, call: null, localStream: null, remoteStream: null }));
        }
      );

      // Create call object
      const call: Call = {
        id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: callType,
        fromUserId: userId,
        toUserId,
        startTime: new Date(),
        status: 'ringing'
      };

      setState(prev => ({ ...prev, call }));

    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      setState(prev => ({ ...prev, call: null, localStream: null, remoteStream: null }));
      throw error;
    }
  }, [userId]);

  const acceptCall = useCallback(async () => {
    if (!state.incomingCall) return;

    try {
      const pendingOffer = (window as any).pendingCallOffer;
      if (!pendingOffer) {
        throw new Error('No pending call offer found');
      }

      setState(prev => ({ ...prev, isHandlingCallEnd: false }));

      await webRTCService.acceptCall(
        pendingOffer.callId,
        pendingOffer.fromUserId,
        pendingOffer.offer,
        pendingOffer.callType,
        (remoteStream) => {
          setState(prev => ({ ...prev, remoteStream }));
        },
        () => {
          setState(prev => ({ ...prev, call: null, localStream: null, remoteStream: null }));
        }
      );

      // Create call object
      const call: Call = {
        id: pendingOffer.callId,
        type: pendingOffer.callType,
        fromUserId: pendingOffer.fromUserId,
        toUserId: userId,
        startTime: new Date(),
        status: 'connected'
      };

      setState(prev => ({ 
        ...prev, 
        call, 
        incomingCall: null 
      }));

      // Clear pending offer
      delete (window as any).pendingCallOffer;

    } catch (error: any) {
      console.error('Failed to accept call:', error);
      setState(prev => ({ 
        ...prev, 
        call: null, 
        localStream: null, 
        remoteStream: null,
        incomingCall: null 
      }));
      throw error;
    }
  }, [state.incomingCall, userId]);

  const rejectCall = useCallback(() => {
    if (!state.incomingCall) return;

    // Add to call history for rejected calls
    const callHistoryEntry: CallHistoryEntry = {
      id: state.incomingCall.callId,
      type: state.incomingCall.callType,
      fromUserId: state.incomingCall.fromUserId,
      toUserId: userId,
      fromUserName: state.incomingCall.fromUserName,
      toUserName: userName,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'declined',
      connectionQuality: 'poor'
    };

    setState(prev => ({
      ...prev,
      incomingCall: null,
      callHistory: [...prev.callHistory, callHistoryEntry]
    }));

    // Generate call history message for chat
    const callHistoryMessage = {
      type: 'call_history',
      chatId: `chat_${state.incomingCall.fromUserId}_${userId}`,
      content: `Call declined`,
      callData: {
        callId: state.incomingCall.callId,
        duration: 0,
        callType: state.incomingCall.callType,
        status: 'declined',
        participants: [state.incomingCall.fromUserId, userId]
      }
    };

    // Send call history via WebSocket
    webSocketService.sendMessage('call_history', callHistoryMessage);

    // Let WebRTC service handle the reject message sending
    webRTCService.rejectCall(state.incomingCall.callId, state.incomingCall.fromUserId);

    // Clear pending offer
    delete (window as any).pendingCallOffer;
  }, [state.incomingCall, userId, userName]);

  const endCall = useCallback(() => {
    if (state.isHandlingCallEnd) return;

    setState(prev => ({ ...prev, isHandlingCallEnd: true }));

    // Clear any existing timeout
    if (callEndTimeoutRef.current) {
      clearTimeout(callEndTimeoutRef.current);
    }

    // Set timeout to reset handling state
    callEndTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isHandlingCallEnd: false }));
    }, 2000);

    webRTCService.endCall();
  }, [state.isHandlingCallEnd]);

  const toggleAudio = useCallback(() => {
    return webRTCService.toggleAudio();
  }, []);

  const toggleVideo = useCallback(() => {
    return webRTCService.toggleVideo();
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      await webRTCService.startScreenShare();
    } catch (error: any) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      await webRTCService.stopScreenShare();
    } catch (error: any) {
      console.error('Failed to stop screen share:', error);
      throw error;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callEndTimeoutRef.current) {
        clearTimeout(callEndTimeoutRef.current);
      }
    };
  }, []);

  // Get call history
  const getCallHistory = useCallback(() => {
    return state.callHistory;
  }, [state.callHistory]);

  // Clear call history
  const clearCallHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      callHistory: []
    }));
  }, []);

  return {
    // State
    call: state.call,
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    isHandlingCallEnd: state.isHandlingCallEnd,
    incomingCall: state.incomingCall,
    callState: state.callState,
    callHistory: state.callHistory,
    connectionQuality: state.connectionQuality,
    isReconnecting: state.isReconnecting,

    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    getCallHistory,
    clearCallHistory
  };
};