import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { useAuth } from "@/react-app/hooks/useAuth";
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

// Public pages
import RoleSelection from "@/react-app/pages/RoleSelection";
import AdminLogin from "@/react-app/pages/AdminLogin";
import Login from "@/react-app/pages/Login";
import Register from "@/react-app/pages/Register";
import AuthCallback from "@/react-app/pages/AuthCallback";

// Protected layout + pages
import Layout from "@/react-app/components/Layout";
import Dashboard from "@/react-app/pages/Dashboard";
import Mentees from "@/react-app/pages/Mentees";
import Projects from "@/react-app/pages/Projects";
import Tasks from "@/react-app/pages/Tasks";
import Announcements from "@/react-app/pages/Announcements";
import EnhancedMessages from "@/react-app/pages/EnhancedMessages";
import Notifications from "@/react-app/pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";

// Call components
import MinimizableCallModal from "@/react-app/components/MinimizableCallModal";

// Call hooks and services
import { useCallSignaling } from "@/react-app/hooks/useCallSignaling";
import { useMockApi } from "@/react-app/hooks/useMockApi";
import { webRTCService } from "@/react-app/services/WebRTCService";
import { webSocketService } from "@/react-app/services/WebSocketService";

// Import proper types
import { User as UserType } from "@/react-app/types";

// Types
interface Call {
  id: string;
  type: 'audio' | 'video';
  fromUserId: string;
  toUserId: string;
  startTime: Date;
  status: 'ringing' | 'connected' | 'rejected' | 'ended';
  from?: {
    id: string;
    name: string;
  };
  to?: {
    id: string;
    name: string;
  };
  participants: string[]; // Array of user IDs participating in the call
}

enum CallStatus {
  RINGING = 'ringing',
  ACTIVE = 'connected',
  REJECTED = 'rejected',
  ENDED = 'ended'
}

// Helper function to convert user to proper UserType
const convertToUserType = (user: any): UserType => ({
  id: user?.id || '',
  name: user?.name || 'Unknown User',
  email: user?.email || '',
  role: user?.role || '',
  avatarUrl: user?.avatar || '',
  isOnline: true
});

// Call Management Component (inside AuthProvider)
const CallManager: React.FC = () => {
  const { user } = useAuth();
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<any>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  
  // Get users data to resolve user names
  const { users } = useMockApi(user?.id || null);
  
  // Helper function to get user by ID
  const getUserById = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    console.log('🔍 Looking for user ID:', userId, 'Found:', foundUser, 'Available users:', users.map(u => ({ id: u.id, name: u.name })));
    return foundUser;
  };
  
  // Helper function to get a better display name
  const getUserDisplayName = (userId: string, fallbackName?: string) => {
    const foundUser = getUserById(userId);
    if (foundUser?.name) {
      return foundUser.name;
    }
    if (fallbackName) {
      return fallbackName;
    }
    // Create a more user-friendly fallback
    return `User ${userId.slice(-4)}`;
  };

  // Initialize call signaling
  const {
    call: callState,
    incomingCall: signalingIncomingCall,
    initiateCall: signalingInitiateCall,
    acceptCall: signalingAcceptCall,
    rejectCall: signalingRejectCall,
    endCall: signalingEndCall
  } = useCallSignaling(user?.id || '', user?.name || '');

  // Get WebRTC service state
  const webRTCState = webRTCService.getCallState();

  // Handle call state changes
  useEffect(() => {
    if (callState) {
      const userDisplayName = getUserDisplayName(callState.toUserId);
      
      setCurrentCall({
        id: callState.id,
        type: callState.type,
        fromUserId: callState.fromUserId,
        toUserId: callState.toUserId,
        startTime: callState.startTime,
        status: callState.status === 'connected' ? 'active' : callState.status as any,
        from: { id: callState.fromUserId, name: user?.name || 'You' },
        to: { id: callState.toUserId, name: userDisplayName },
        participants: [callState.fromUserId, callState.toUserId]
      });
    } else {
      setCurrentCall(null);
    }
  }, [callState, user, users]);

  // Handle incoming calls
  useEffect(() => {
    if (signalingIncomingCall) {
      const userDisplayName = getUserDisplayName(signalingIncomingCall.fromUserId, signalingIncomingCall.fromUserName);
      
      setIncomingCall({
        id: signalingIncomingCall.callId,
        type: signalingIncomingCall.callType,
        fromUserId: signalingIncomingCall.fromUserId,
        toUserId: user?.id || '',
        startTime: new Date(),
        status: 'ringing',
        from: { id: signalingIncomingCall.fromUserId, name: userDisplayName },
        to: { id: user?.id || '', name: user?.name || 'You' },
        participants: [signalingIncomingCall.fromUserId, user?.id || '']
      });
    } else {
      setIncomingCall(null);
    }
  }, [signalingIncomingCall, user, users]);

  // Listen for call status updates
  useEffect(() => {
    const handleCallAccepted = (data: any) => {
      console.log('📞 Call accepted:', data);
      if (outgoingCall && data.callId === outgoingCall.id) {
        setOutgoingCall((prev: Call | null) => prev ? { ...prev, status: 'connected' } : null);
        setCurrentCall((prev: Call | null) => prev ? { ...prev, status: 'connected' } : null);
      }
      if (incomingCall && data.callId === incomingCall.id) {
        setIncomingCall((prev: Call | null) => prev ? { ...prev, status: 'connected' } : null);
        setCurrentCall((prev: Call | null) => prev ? { ...prev, status: 'connected' } : null);
      }
    };

    const handleCallRejected = (data: any) => {
      console.log('📞 Call rejected:', data);
      if (outgoingCall && data.callId === outgoingCall.id) {
        setOutgoingCall((prev: Call | null) => prev ? { ...prev, status: 'rejected' } : null);
        // Note: call_end event will handle closing the modal
      }
    };

    const handleCallEnded = (data: any) => {
      console.log('📞 Call ended:', data);
      setCurrentCall(null);
      setIncomingCall(null);
      setOutgoingCall(null);
    };

    // Add event listeners
    webSocketService.on('call_accepted', handleCallAccepted);
    webSocketService.on('call_rejected', handleCallRejected);
    webSocketService.on('call_ended', handleCallEnded);

    // Cleanup
    return () => {
      webSocketService.off('call_accepted', handleCallAccepted);
      webSocketService.off('call_rejected', handleCallRejected);
      webSocketService.off('call_ended', handleCallEnded);
    };
  }, [outgoingCall, incomingCall]);

  // Call handlers
  const handleInitiateCall = async (toUserId: string, callType: 'audio' | 'video') => {
    try {
      await signalingInitiateCall(toUserId, callType);
      const userDisplayName = getUserDisplayName(toUserId);
      
      setOutgoingCall({
        id: `call-${Date.now()}`,
        type: callType,
        fromUserId: user?.id || '',
        toUserId,
        startTime: new Date(),
        status: 'ringing',
        from: { id: user?.id || '', name: user?.name || 'You' },
        to: { id: toUserId, name: userDisplayName },
        participants: [user?.id || '', toUserId]
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleAcceptCall = async () => {
    try {
      await signalingAcceptCall();
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleRejectCall = () => {
    signalingRejectCall();
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    signalingEndCall();
    setCurrentCall(null);
    setOutgoingCall(null);
  };


  const handleMinimizeCall = () => {
    setIsCallMinimized(true);
  };

  const handleMaximizeCall = () => {
    setIsCallMinimized(false);
  };


  // Determine call states
  const isReceivingCall = incomingCall && incomingCall.status === CallStatus.RINGING;
  const isOutgoingCall = outgoingCall && (outgoingCall.status === CallStatus.RINGING || outgoingCall.status === CallStatus.REJECTED);
  const isCallActive = currentCall && currentCall.status === CallStatus.ACTIVE;
  const isCallRejected = (outgoingCall && outgoingCall.status === CallStatus.REJECTED) || (incomingCall && incomingCall.status === CallStatus.REJECTED);
  
  // Check if WebRTC hooks are handling incoming calls
  const hasWebRTCIncomingCall = signalingIncomingCall !== null;

  return (
    <>
      {/* Minimizable Call Modal - Unified call interface */}
      {(isReceivingCall || isOutgoingCall || isCallActive || isCallRejected || hasWebRTCIncomingCall) && user && (currentCall || incomingCall || outgoingCall) && (
        <MinimizableCallModal
          call={currentCall || incomingCall || outgoingCall}
          user={convertToUserType(user)}
          callType={currentCall?.type || incomingCall?.type || outgoingCall?.type || 'audio'}
          isIncoming={isReceivingCall && !isCallActive}
          localStream={webRTCState.localStream}
          remoteStream={webRTCState.remoteStream}
          isAudioEnabled={webRTCState.isAudioEnabled}
          isVideoEnabled={webRTCState.isVideoEnabled}
          isScreenSharing={webRTCState.isScreenSharing}
          connectionQuality={webRTCState.connectionQuality}
          callDuration={webRTCState.callDuration}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEndCall={handleEndCall}
          onToggleAudio={() => webRTCService.toggleAudio()}
          onToggleVideo={() => webRTCService.toggleVideo()}
          onToggleScreenShare={async () => {
            try {
              if (webRTCState.isScreenSharing) {
                await webRTCService.stopScreenShare();
              } else {
                await webRTCService.startScreenShare();
              }
            } catch (error) {
              console.error('Screen sharing toggle failed:', error);
            }
          }}
          onMinimize={handleMinimizeCall}
          onMaximize={handleMaximizeCall}
          isMinimized={isCallMinimized}
        />
      )}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelection />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes under /app */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={
            <div className={`${isCallActive || isOutgoingCall ? 'filter blur-sm' : ''}`}>
              <Layout onInitiateCall={handleInitiateCall} />
            </div>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="mentees" element={<Mentees />} />
            <Route path="mentors" element={<Mentees />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="messages" element={<EnhancedMessages onInitiateCall={handleInitiateCall} />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reviews" element={<Projects />} />
            <Route path="certificates" element={<Dashboard />} />
            <Route path="users" element={<Mentees />} />
            <Route path="approvals" element={<Projects />} />
            <Route path="analytics" element={<Dashboard />} />
            <Route path="settings" element={<Dashboard />} />
            <Route path="config" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

// Main App Component with Call Integration
const AppWithCalls: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <CallManager />
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default AppWithCalls;
