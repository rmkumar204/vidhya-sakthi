import { useState, useEffect, useCallback } from 'react';
import { User, Call, CallStatus } from '../types';
import { webRTCService } from '../services/WebRTCService';
import { webSocketService } from '../services/WebSocketService';

const CALL_STORAGE_KEY = 'connectsphere-call-state';

const useCallSignaling = (currentUser: User | null) => {
  const [call, setCall] = useState<Call | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isHandlingCallEnd, setIsHandlingCallEnd] = useState(false);
  const [callHistoryAdded, setCallHistoryAdded] = useState(false); // Prevent duplicate call history

  console.log('🎯 useCallSignaling: Hook initialized with user:', currentUser?.name, 'Current call:', call?.status);

  useEffect(() => {
    // Only proceed if we have a valid user with an ID
    if (!currentUser || !currentUser.id) {
      console.log('🎯 useCallSignaling: No valid user, skipping setup');
      return;
    }

    // Setup WebSocket listeners for incoming calls
    const handleIncomingCall = (data: any) => {
      if (currentUser && currentUser.id && data.callType) {
        const incomingCall: Call = {
          id: `call-${Date.now()}`,
          from: data.from,
          to: currentUser,
          type: data.callType,
          status: CallStatus.RINGING,
          participants: [data.from.id, currentUser.id]
        };
        setCall(incomingCall);
        updateCallState(incomingCall);
      }
    };

    const handleCallEnd = () => {
      if (isHandlingCallEnd) {
        console.log('⚠️ Call end already being handled, ignoring duplicate');
        return;
      }
      
      setIsHandlingCallEnd(true);
      console.log('📞 Call end signal received via WebSocket');
      
      // Clear local call state immediately
      setCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setCallHistoryAdded(false); // Reset call history flag
      updateCallState(null);
      
      // Force cleanup WebRTC resources without triggering callback loop
      if (webRTCService.getLocalStream() || webRTCService.getRemoteStream()) {
        console.log('🧹 Force cleaning WebRTC resources without callback trigger');
        webRTCService.cleanup();
      }
      
      console.log('✅ Call state cleared after remote end signal');
      
      // Reset the flag after a delay
      setTimeout(() => {
        setIsHandlingCallEnd(false);
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
            console.log('🧹 Clearing stale call state:', { isStale, isWrongUser });
            localStorage.removeItem(CALL_STORAGE_KEY);
            setCall(null);
          } else {
            setCall(parsedCall);
          }
        } catch (error) {
          console.error('Error parsing call state:', error);
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
    webSocketService.on('call_offer', handleIncomingCall);
    webSocketService.on('call_end', handleCallEnd);
    
    // Storage listeners (fallback)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('connectsphere-call-update', handleCallUpdate);
    
    return () => {
      webSocketService.off('call_offer', handleIncomingCall);
      webSocketService.off('call_end', handleCallEnd);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('connectsphere-call-update', handleCallUpdate);
      
      console.log('🧹 useCallSignaling: Cleaned up WebSocket and storage listeners');
    };
  }, [currentUser?.id]); // Only depend on user ID, not the entire user object

  // Separate useEffect for WebRTC callbacks to prevent re-registration
  useEffect(() => {
    // WebRTC service callbacks
    const handleRemoteStream = (stream: MediaStream) => {
      setRemoteStream(stream);
    };
    
    const handleWebRTCCallEnd = () => {
      console.log('🔄 WebRTC service triggered call end callback');
      // Only clear local state, don't call handleCallEnd to avoid recursion
      setCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      updateCallState(null);
    };

    webRTCService.onRemoteStream(handleRemoteStream);
    webRTCService.onCallEnd(handleWebRTCCallEnd);

    return () => {
      // Clear WebRTC callbacks to prevent memory leaks
      webRTCService.onRemoteStream(() => {});
      webRTCService.onCallEnd(() => {});
      console.log('🧹 useCallSignaling: Cleaned up WebRTC callbacks');
    };
  }, []); // Empty dependency array - only run once

  const updateCallState = (newCallState: Call | null) => {
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
      console.log('⚠️ Call history already added or no valid user, skipping:', { callHistoryAdded, currentUser: !!currentUser });
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
          console.log('🌐 Sending call history message via WebSocket for cross-browser sync');
          const targetChatId = chat.id;
          webSocketService.sendChatMessage(targetChatId, historyMessage.content, 'call-history');
        }
        
        window.dispatchEvent(new CustomEvent('connectsphere-chat-update'));
        console.log('📝 Added call history message:', historyMessage);
      } else {
        console.log('⚠️ Duplicate call history message detected, skipping:', historyMessage);
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
      console.error('Failed to initiate call:', error);
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
        
        // Answer the WebRTC call with proper call type
        const stream = await webRTCService.answerCall(currentUser.id, call.from.id, call.type);
        setLocalStream(stream);
        
        console.log('✅ Call accepted successfully:', call.type);
      } catch (error) {
        console.error('❌ Failed to accept call:', error);
        
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
        console.error('User Error:', errorMessage);
        
        rejectCall();
      }
    }
  }, [call?.id, call?.to.id, call?.from.id, call?.type, currentUser?.id]); // More specific dependencies

  const rejectCall = useCallback(() => {
    if (call && currentUser?.id && (call.to.id === currentUser.id || call.from.id === currentUser.id)) {
        console.log('🚫 Rejecting call:', call);
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
          
          console.log('✅ Call rejected and cleaned up successfully');
        } catch (error) {
          console.error('❌ Error rejecting call:', error);
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
      console.log('⚠️ End call already being handled, ignoring duplicate');
      return;
    }
    
    if (call && currentUser?.id && (call.to.id === currentUser.id || call.from.id === currentUser.id)) {
        setIsHandlingCallEnd(true);
        console.log('📞 Ending call:', call);
        
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
            console.log('🔄 Forcing chat state refresh after call end');
            window.dispatchEvent(new CustomEvent('connectsphere-chat-refresh'));
            // Also trigger a WebSocket connection check
            window.dispatchEvent(new CustomEvent('connectsphere-websocket-check'));
          }, 100);
          
          console.log('✅ Call ended and cleaned up successfully');
        } catch (error) {
          console.error('❌ Error ending call:', error);
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
    console.log('🆘 Emergency call state reset triggered');
    localStorage.removeItem(CALL_STORAGE_KEY);
    setCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    webRTCService.endCall();
  }, []);

  // Expose emergency reset function globally for debugging
  useEffect(() => {
    (window as any).emergencyCallReset = emergencyReset;
    return () => {
      delete (window as any).emergencyCallReset;
    };
  }, [emergencyReset]);

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
