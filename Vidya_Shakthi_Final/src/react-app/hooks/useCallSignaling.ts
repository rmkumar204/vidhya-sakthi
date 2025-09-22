import { useState, useEffect, useCallback } from 'react';
import { User, Call, CallStatus } from '../types';
import { webRTCService } from '../services/WebRTCService';
import { webSocketService } from '../services/WebSocketService';
import { logger } from '../utils/logger';

const CALL_STORAGE_KEY = 'connectsphere-call-state';

const useCallSignaling = (currentUser: User | null) => {
  const [call, setCall] = useState<Call | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isHandlingCallEnd, setIsHandlingCallEnd] = useState(false);
  const [callHistoryAdded, setCallHistoryAdded] = useState(false); // Prevent duplicate call history

  logger.call('🎯 useCallSignaling: Hook initialized with user:', currentUser?.name, 'Current call:', call?.status);

  useEffect(() => {
    // Only proceed if we have a valid user with an ID
    if (!currentUser || !currentUser.id) {
      logger.call('🎯 useCallSignaling: No valid user, skipping setup');
      return;
    }

    // Setup WebSocket listeners for incoming calls
    const handleIncomingCall = (data: any) => {
      if (currentUser && currentUser.id && data.callType) {
        // Create a proper User object from the incoming data
        const fromUser: User = {
          id: data.fromUserId,
          name: data.fromUserName || `User ${data.fromUserId.slice(-4)}`,
          email: '', // Not provided in call offer
          role: '', // Not provided in call offer
          avatarUrl: '', // Not provided in call offer
          isOnline: true
        };
        
        const incomingCall: Call = {
          id: `call-${Date.now()}`,
          from: fromUser,
          to: currentUser,
          type: data.callType,
          status: CallStatus.RINGING,
          participants: [data.fromUserId, currentUser.id]
        };
        setCall(incomingCall);
        updateCallState(incomingCall);
      }
    };

    const handleCallAccept = (data: any) => {
      logger.call('✅ ❗ useCallSignaling: Call accept signal received via WebSocket:', data);
      logger.call('🔍 Current call state before handling accept:', {
        callId: call?.id,
        callStatus: call?.status,
        fromUser: call?.from?.id,
        toUser: call?.to?.id,
        currentUserId: currentUser?.id,
        dataFromUserId: data?.fromUserId,
        dataCallId: data?.callId
      });
      
      // More robust check: accept message should be from the person we're calling
      if (call && call.status === CallStatus.RINGING) {
        // Additional validation: ensure this accept message is for our current call
        const isValidAccept = !data?.callId || data.callId === call.id;
        const isFromExpectedUser = !data?.fromUserId || data.fromUserId === call.to.id;
        
        if (isValidAccept && isFromExpectedUser) {
          logger.call('🔄 Updating call status to ACTIVE after remote acceptance');
          const acceptedCall: Call = { ...call, status: CallStatus.ACTIVE };
          setCall(acceptedCall);
          updateCallState(acceptedCall);
          
          logger.call('✅ Call status updated to ACTIVE on caller side');
          
          // Force trigger React re-render by dispatching custom event
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('connectsphere-call-state-changed', {
              detail: { call: acceptedCall, action: 'call_accepted' }
            }));
            
            // Additional force refresh for app component
            window.dispatchEvent(new CustomEvent('connectsphere-call-update'));
          }, 100);
        } else {
          logger.call('⚠️ Call accept validation failed:', {
            isValidAccept,
            isFromExpectedUser,
            expectedCallId: call.id,
            receivedCallId: data?.callId,
            expectedFromUser: call.to.id,
            receivedFromUser: data?.fromUserId
          });
        }
      } else {
        logger.call('⚠️ No ringing call found to update or call already active. Current call:', {
          hasCall: !!call,
          callStatus: call?.status,
          expectedStatus: CallStatus.RINGING,
          callId: call?.id
        });
        
        // Emergency fallback: if we have any call and it's not ACTIVE, force it to ACTIVE
        if (call && call.status !== CallStatus.ACTIVE && call.status !== CallStatus.CONNECTED) {
          logger.call('🆘 Emergency fallback: forcing call to ACTIVE state');
          const emergencyActiveCall: Call = { ...call, status: CallStatus.ACTIVE };
          setCall(emergencyActiveCall);
          updateCallState(emergencyActiveCall);
        }
      }
    };

    const handleCallEnd = (data: any) => {
      logger.call('🔴 ❗ useCallSignaling: Call end signal received via WebSocket:', data);
      
      if (isHandlingCallEnd) {
        logger.call('⚠️ Call end already being handled, ignoring duplicate');
        return;
      }
      
      setIsHandlingCallEnd(true);
      logger.call('📞 useCallSignaling: Processing call end signal');
      
      // Clear local call state immediately
      logger.call('🧠 Clearing call state:', {
        currentCall: call?.id,
        localStreamActive: !!localStream,
        remoteStreamActive: !!remoteStream
      });
      
      setCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setCallHistoryAdded(false); // Reset call history flag
      updateCallState(null);
      
      // Force cleanup WebRTC resources without triggering callback loop
      if (webRTCService.getLocalStream() || webRTCService.getRemoteStream()) {
        logger.call('🧹 Force cleaning WebRTC resources without callback trigger');
        webRTCService.cleanup();
      }
      
      logger.call('✅ Call state cleared after remote end signal');
      
      // Reset the flag after a delay
      setTimeout(() => {
        setIsHandlingCallEnd(false);
        logger.call('🔄 Call end handling flag reset');
      }, 500);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CALL_STORAGE_KEY) {
        const newCallState = event.newValue ? JSON.parse(event.newValue) : null;
        setCall(newCallState);
      }
    };
    
    const handleCallUpdate = () => {
      const callState = localStorage.getItem(CALL_STORAGE_KEY);
      setCall(callState ? JSON.parse(callState) : null);
    };
    
    // Clear any stale call state when user changes or on first load
    const clearStaleCallState = () => {
      const callState = localStorage.getItem(CALL_STORAGE_KEY);
      if (callState) {
        try {
          const parsedCall = JSON.parse(callState);
          // Clear call state if it's stale (older than 30 seconds) or if user doesn't match
          const isStale = Date.now() - (parsedCall.timestamp || 0) > 30000;
          const isWrongUser = !currentUser || (parsedCall.from?.id !== currentUser.id && parsedCall.to?.id !== currentUser.id);
          
          if (isStale || isWrongUser) {
            logger.call('🧹 Clearing stale call state:', { isStale, isWrongUser });
            localStorage.removeItem(CALL_STORAGE_KEY);
            setCall(null);
          } else {
            setCall(parsedCall);
          }
        } catch (error) {
          logger.error('Error parsing call state:', error);
          localStorage.removeItem(CALL_STORAGE_KEY);
          setCall(null);
        }
      }
    };
    
    // Only set initial state if currentUser exists and has valid ID
    if (currentUser && currentUser.id) {
      clearStaleCallState();
    } else {
      // Clear any call state if no user is logged in
      localStorage.removeItem(CALL_STORAGE_KEY);
      setCall(null);
    }

    // WebSocket listeners
    logger.call('🔍 Registering WebSocket listeners for useCallSignaling...');
    webSocketService.on('call_offer', handleIncomingCall);
    webSocketService.on('call_end', handleCallEnd);
    webSocketService.on('call_accept', handleCallAccept);
    logger.call('✅ WebSocket listeners registered successfully');
    
    // Debug current listeners
    setTimeout(() => {
      webSocketService.debugListeners();
    }, 100);
    
    // Storage listeners (fallback)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('connectsphere-call-update', handleCallUpdate);
    
    return () => {
      webSocketService.off('call_offer', handleIncomingCall);
      webSocketService.off('call_end', handleCallEnd);
      webSocketService.off('call_accept', handleCallAccept);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('connectsphere-call-update', handleCallUpdate);
      
      logger.call('🧹 useCallSignaling: Cleaned up WebSocket and storage listeners');
    };
  }, [currentUser?.id]); // Only depend on user ID, not the entire user object

  // Separate useEffect for WebRTC callbacks to prevent re-registration
  useEffect(() => {
    // WebRTC service callbacks
    const handleRemoteStream = (stream: MediaStream) => {
      setRemoteStream(stream);
    };
    
    const handleWebRTCCallEnd = () => {
      logger.call('🔄 WebRTC service triggered call end callback');
      // Only clear local state, don't call handleCallEnd to avoid recursion
      setCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      updateCallState(null);
    };

    const handleWebRTCCallAccept = (data: any) => {
      logger.call('✅ WebRTC service triggered call accept callback:', data);
      // This is handled by WebSocket message, just for additional logging
    };

    webRTCService.onRemoteStream(handleRemoteStream);
    webRTCService.onCallEnd(handleWebRTCCallEnd);
    webRTCService.onCallAccept(handleWebRTCCallAccept);

    return () => {
      // Clear WebRTC callbacks to prevent memory leaks
      webRTCService.onRemoteStream(() => {});
      webRTCService.onCallEnd(() => {});
      webRTCService.onCallAccept(() => {});
      logger.call('🧹 useCallSignaling: Cleaned up WebRTC callbacks');
    };
  }, []); // Empty dependency array - only run once

  const updateCallState = (newCallState: Call | null) => {
    logger.call('🔄 updateCallState called:', {
      previous: call?.status,
      new: newCallState?.status,
      callId: newCallState?.id,
      fromUser: newCallState?.from?.id,
      toUser: newCallState?.to?.id
    });
    
    setCall(newCallState);
    if (newCallState) {
        const callStateWithTimestamp = {
          ...newCallState,
          timestamp: Date.now()
        };
        localStorage.setItem(CALL_STORAGE_KEY, JSON.stringify(callStateWithTimestamp));
    } else {
        localStorage.removeItem(CALL_STORAGE_KEY);
    }
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('connectsphere-call-update'));
  };

  // Add call history message to chat
  const addCallHistoryMessage = (call: Call, duration: number) => {
    if (!currentUser || !currentUser.id || callHistoryAdded) {
      logger.call('⚠️ Call history already added or no valid user, skipping:', { callHistoryAdded, currentUser: !!currentUser });
      return;
    }
    
    setCallHistoryAdded(true); // Mark as added to prevent duplicates
    
    const otherUser = call.from.id === currentUser.id ? call.to : call.from;
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };
    
    // Generate truly unique ID to prevent React key duplication
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const userSuffix = currentUser.id.substr(-3);
    const uniqueId = `call-history-${timestamp}-${userSuffix}-${randomSuffix}`;
    
    const historyMessage = {
      id: uniqueId,
      senderId: currentUser.id,
      content: `${call.type === 'video' ? '📹' : '📞'} ${call.type} call with ${otherUser.name} - ${formatDuration(duration)}`,
      timestamp: Date.now(),
      type: 'call-history' as const,
      callDuration: duration,
      callType: call.type
    };
    
    // Add to localStorage chat with duplicate prevention
    const existingChats = JSON.parse(localStorage.getItem('connectsphere-chats') || '[]');
    const chatIndex = existingChats.findIndex((c: any) => 
      c.userIds.includes(currentUser.id) && c.userIds.includes(otherUser.id)
    );
    
    if (chatIndex !== -1) {
      const chat = existingChats[chatIndex];
      
      // Check for duplicate call history entries (prevent multiple entries for same call)
      const isDuplicate = chat.messages.some((msg: any) => {
        if (msg.type !== 'call-history') return false;
        
        // Consider it duplicate if same call type, users, and within last 10 seconds
        const timeDiff = Math.abs(msg.timestamp - historyMessage.timestamp);
        const sameCallType = msg.callType === historyMessage.callType;
        const sameContent = msg.content.includes(otherUser.name) && msg.content.includes(call.type);
        
        return sameCallType && sameContent && timeDiff < 10000; // 10 seconds
      });
      
      if (!isDuplicate) {
        existingChats[chatIndex].messages.push(historyMessage);
        localStorage.setItem('connectsphere-chats', JSON.stringify(existingChats));
        
        // Send via WebSocket for cross-browser sync if connected
        if (webSocketService.isConnected()) {
          logger.call('🌐 Sending call history message via WebSocket for cross-browser sync');
          const targetChatId = chat.id;
          webSocketService.sendChatMessage(targetChatId, historyMessage.content, 'call-history');
        }
        
        window.dispatchEvent(new CustomEvent('connectsphere-chat-update'));
        logger.call('📝 Added call history message:', historyMessage);
      } else {
        logger.call('⚠️ Duplicate call history message detected, skipping:', historyMessage);
      }
    }
  };

  const initiateCall = useCallback(async (userToCall: User, type: 'video' | 'audio') => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      // Reset call history flag for new call
      setCallHistoryAdded(false);
      
      const newCall: Call = {
        id: `call-${Date.now()}`,
        from: currentUser,
        to: userToCall,
        type,
        status: CallStatus.RINGING,
        participants: [currentUser.id, userToCall.id]
      };
      setCall(newCall);
      updateCallState(newCall);
      
      // Initialize WebRTC call
      const stream = await webRTCService.initializeCall(currentUser.id, userToCall.id, type);
      setLocalStream(stream);
    } catch (error) {
      logger.error('Failed to initiate call:', error);
      setCall(null);
      updateCallState(null);
    }
  }, [currentUser?.id]);

  const acceptCall = useCallback(async () => {
    if (call && currentUser?.id && call.to.id === currentUser.id) {
      try {
        // Reset call history flag for accepted call
        setCallHistoryAdded(false);
        
        const acceptedCall: Call = { ...call, status: CallStatus.ACTIVE };
        setCall(acceptedCall);
        updateCallState(acceptedCall);
        
        // Send call accept notification to the caller BEFORE answering WebRTC
        logger.call('✅ Sending call accept notification to caller:', call.from.id);
        if (webSocketService.isConnected()) {
          webSocketService.sendCallAccept(call.from.id, call.id);
        }
        
        // Answer the WebRTC call with proper call type
        const stream = await webRTCService.answerCall(currentUser.id, call.from.id, call.type);
        setLocalStream(stream);
        
        logger.call('✅ Call accepted successfully:', call.type);
      } catch (error) {
        logger.error('❌ Failed to accept call:', error);
        
        // Provide user-friendly error message
        let errorMessage = 'Failed to accept call. Please try again.';
        if (error instanceof Error) {
          if (error.message && error.message.includes('Camera/microphone is currently in use')) {
            errorMessage = error.message;
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera/microphone is currently in use by another application. Please close other applications and try again.';
          } else if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera/microphone access was denied. Please allow access and try again.';
          }
        }
        
        // Show error to user (you can replace this with your preferred notification system)
        logger.error('User Error:', errorMessage);
        
        rejectCall();
      }
    }
  }, [call?.id, call?.to.id, call?.from.id, call?.type, currentUser?.id]); // More specific dependencies

  const rejectCall = useCallback(() => {
    if (call && currentUser?.id && (call.to.id === currentUser.id || call.from.id === currentUser.id)) {
        logger.call('🚫 Rejecting call:', call);
        try {
          // End WebRTC call and cleanup
          webRTCService.endCall();
          
          // Send call end notification to other user
          const otherUserId = call.from.id === currentUser?.id ? call.to.id : call.from.id;
          if (webSocketService.isConnected()) {
            webSocketService.sendCallEnd(otherUserId);
          }
          
          // Clear local state
          setCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          localStorage.removeItem(CALL_STORAGE_KEY);
          
          // Dispatch update event
          window.dispatchEvent(new CustomEvent('connectsphere-call-update'));
          
          logger.call('✅ Call rejected and cleaned up successfully');
        } catch (error) {
          logger.error('❌ Error rejecting call:', error);
          // Force cleanup even if there's an error
          setCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          localStorage.removeItem(CALL_STORAGE_KEY);
        }
    }
  }, [call?.id, call?.to.id, call?.from.id, currentUser?.id]);

  const endCall = useCallback(() => {
    if (isHandlingCallEnd) {
      logger.call('⚠️ End call already being handled, ignoring duplicate');
      return;
    }
    
    if (call && currentUser?.id && (call.to.id === currentUser.id || call.from.id === currentUser.id)) {
        setIsHandlingCallEnd(true);
        logger.call('📞 Ending call:', call);
        
        // Calculate call duration (estimate based on when call started)
        const callDuration = Math.floor((Date.now() - (call.startTime?.getTime() || Date.now())) / 1000);
        
        try {
          // Clear local state FIRST to prevent recursion
          setCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          localStorage.removeItem(CALL_STORAGE_KEY);
          
          // Add call history message to chat
          addCallHistoryMessage(call, callDuration);
          
          // End WebRTC call (this will send notification)
      webRTCService.endCall();
          
          // Dispatch update event
          window.dispatchEvent(new CustomEvent('connectsphere-call-update'));
          
          // Force a small delay to ensure chat state is restored
          setTimeout(() => {
            logger.call('🔄 Forcing chat state refresh after call end');
            window.dispatchEvent(new CustomEvent('connectsphere-chat-refresh'));
            // Also trigger a WebSocket connection check
            window.dispatchEvent(new CustomEvent('connectsphere-websocket-check'));
          }, 100);
          
          logger.call('✅ Call ended and cleaned up successfully');
        } catch (error) {
          logger.error('❌ Error ending call:', error);
          // Force cleanup even if there's an error
          setCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          localStorage.removeItem(CALL_STORAGE_KEY);
        } finally {
          // Reset the flag after a delay
          setTimeout(() => {
            setIsHandlingCallEnd(false);
          }, 500);
        }
    }
  }, [call?.id, call?.to.id, call?.from.id, call?.startTime, currentUser?.id, isHandlingCallEnd]);

  const toggleAudio = useCallback((enabled: boolean) => {
    webRTCService.toggleAudio(enabled);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    webRTCService.toggleVideo(enabled);
  }, []);

  // Emergency reset function (for debugging)
  const emergencyReset = useCallback(() => {
    logger.call('🆘 Emergency call state reset triggered');
    localStorage.removeItem(CALL_STORAGE_KEY);
    setCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    webRTCService.endCall();
  }, []);

  // Expose emergency reset function globally for debugging
  useEffect(() => {
    (window as any).emergencyCallReset = emergencyReset;
    (window as any).debugWebSocketListeners = () => {
      logger.call('🔍 Debugging WebSocket listeners from useCallSignaling:');
      webSocketService.debugListeners();
    };
    (window as any).debugCallState = () => {
      logger.call('📡 Current call state:', {
        call: call,
        callStatus: call?.status,
        fromUser: call?.from?.id,
        toUser: call?.to?.id,
        currentUser: currentUser?.id,
        localStream: !!localStream,
        remoteStream: !!remoteStream
      });
    };
    (window as any).forceCallActive = () => {
      if (call && call.status === CallStatus.RINGING) {
        logger.call('🔴 Forcing call state to ACTIVE for debugging');
        const activeCall: Call = { ...call, status: CallStatus.ACTIVE };
        setCall(activeCall);
        updateCallState(activeCall);
      } else {
        logger.call('⚠️ No ringing call to activate');
      }
    };
    return () => {
      delete (window as any).emergencyCallReset;
      delete (window as any).debugWebSocketListeners;
      delete (window as any).debugCallState;
      delete (window as any).forceCallActive;
    };
  }, [emergencyReset, call, currentUser, localStream, remoteStream]);

  return {
    call, 
    localStream, 
    remoteStream, 
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
};

export default useCallSignaling;
