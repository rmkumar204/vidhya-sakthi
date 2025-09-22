import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { useAuth } from "@/react-app/hooks/useAuth";
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { logger } from "@/react-app/utils/logger";

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
import CallHistoryPage from "@/react-app/pages/CallHistoryPage";
import Connect from "@/react-app/pages/Connect";
import ProtectedRoute from "./components/ProtectedRoute";

// Call components from connectsphere
import CallModal from "@/react-app/components/CallModal";
import OutgoingCallModal from "@/react-app/components/OutgoingCallModal";
import AudioCallView from "@/react-app/components/AudioCallView";
import VideoCallView from "@/react-app/components/VideoCallView";

// Call hooks and services
import useCallSignaling from "@/react-app/hooks/useCallSignaling";
import { useMockApi } from "@/react-app/hooks/useMockApi";
import { getUserData, getUserDisplayName } from "@/react-app/services/UserService";

// Import proper types
import { User as UserType, CallStatus } from "@/react-app/types";

// Helper function to convert user to proper UserType
const convertToUserType = (user: any): UserType => ({
  id: user?.id || '',
  name: user?.name || 'Unknown User',
  email: user?.email || '',
  role: user?.role || '',
  avatarUrl: user?.avatar || 'https://via.placeholder.com/150/cccccc/969696?text=User',
  isOnline: true
});

// Call Management Component (inside AuthProvider)
const CallManager: React.FC = () => {
  const { user } = useAuth();
  
  // Get users data to resolve user names
  const { users } = useMockApi(user?.id || null);
  
  // Helper function to get a better display name
  const getUserDisplayNameLocal = async (userId: string, fallbackName?: string) => {
    const token = localStorage.getItem('access_token');
    const userData = await getUserData(userId, token || undefined);
    if (userData?.name) {
      return userData.name;
    }
    if (fallbackName) {
      return fallbackName;
    }
    // Use the service's fallback
    return getUserDisplayName(userId, fallbackName);
  };

  // Initialize call signaling with connectsphere implementation
  // Always pass a user object to maintain hook order consistency
  const currentUser = user ? convertToUserType(user) : {
    id: '',
    name: 'Unknown User',
    email: '',
    role: '',
    avatarUrl: 'https://via.placeholder.com/150/cccccc/969696?text=User',
    isOnline: false
  };
  
  const {
    call: callState,
    initiateCall: signalingInitiateCall,
    acceptCall: signalingAcceptCall,
    rejectCall: signalingRejectCall,
    endCall: signalingEndCall
  } = useCallSignaling(currentUser);

  // Handle call state changes with additional event listener for reliability
  useEffect(() => {
    if (callState) {
      const updateCallWithUserData = async () => {
        const userDisplayName = await getUserDisplayNameLocal(callState.to.id);
        
        // Update call state with proper user display name
        callState.to.name = userDisplayName;
        
        // For both video and audio calls, keep currentCall to show appropriate modal
        if (callState.status === CallStatus.ACTIVE || callState.status === CallStatus.CONNECTED) {
          // Call is active
        }
      };
      
      updateCallWithUserData();
    }
    
    // Add custom event listener for call state changes (additional reliability)
    const handleCallStateChanged = (event: CustomEvent) => {
      logger.info('🔔 AppWithCalls: Custom call state change event received:', event.detail);
      // Force a re-render by updating a dummy state if needed
      if (event.detail?.action === 'call_accepted') {
        logger.info('✅ Call accepted event detected, ensuring UI updates');
        // The state should already be updated, but this ensures React re-renders
      }
    };
    
    window.addEventListener('connectsphere-call-state-changed', handleCallStateChanged as EventListener);
    
    return () => {
      window.removeEventListener('connectsphere-call-state-changed', handleCallStateChanged as EventListener);
    };
  }, [callState, user, users]);

  // Call handlers
  const handleInitiateCall = async (toUserId: string, callType: 'audio' | 'video') => {
    try {
      const userDisplayName = await getUserDisplayNameLocal(toUserId);
      const userToCall: UserType = {
        id: toUserId,
        name: userDisplayName,
        email: '',
        role: 'mentee',
        avatarUrl: '',
        isOnline: true
      };
      
      await signalingInitiateCall(userToCall, callType);
    } catch (error) {
      logger.error('Failed to initiate call:', error);
    }
  };

  const handleAcceptCall = async () => {
    try {
      await signalingAcceptCall();
    } catch (error) {
      logger.error('Failed to accept call:', error);
    }
  };

  const handleRejectCall = () => {
    signalingRejectCall();
  };

  const handleEndCall = () => {
    signalingEndCall();
  };

  // Determine call states with improved logic
  const isReceivingCall = callState && callState.status === CallStatus.RINGING && callState.to.id === user?.id;
  const isOutgoingCall = callState && callState.status === CallStatus.RINGING && callState.from.id === user?.id;
  const isCallActive = callState && (callState.status === CallStatus.ACTIVE || callState.status === CallStatus.CONNECTED);
  const isAudioCall = callState && callState.type === 'audio';
  const otherUserInCall = callState ? (callState.from.id === user?.id ? callState.to : callState.from) : null;

  // Debug call state logic with enhanced logging
  useEffect(() => {
    if (callState) {
      logger.info('📡 ❗ AppWithCalls: Call state changed:', {
        callId: callState.id,
        callStatus: callState.status,
        fromUser: callState.from.id,
        toUser: callState.to.id,
        currentUser: user?.id,
        isReceivingCall,
        isOutgoingCall,
        isCallActive,
        callType: callState.type,
        shouldShowIncoming: isReceivingCall,
        shouldShowOutgoing: isOutgoingCall,
        shouldShowActiveCall: isCallActive
      });
      
      // Additional debug: Check what UI components should be visible
      if (isCallActive) {
        logger.info('🎯 Active call detected - should show AudioCallView/VideoCallView');
      } else if (isOutgoingCall) {
        logger.info('📞 Outgoing call detected - should show OutgoingCallModal');
      } else if (isReceivingCall) {
        logger.info('📲 Incoming call detected - should show CallModal');
      }
    } else {
      logger.info('📡 AppWithCalls: No call state - all call components should be hidden');
    }
  }, [callState?.status, callState?.id, isReceivingCall, isOutgoingCall, isCallActive]);

  // Expose debugging functions globally for testing
  useEffect(() => {
    (window as any).debugAppCallState = () => {
      logger.info('📡 ❗ AppWithCalls Debug State:');
      logger.info('- callState:', callState);
      logger.info('- callState.status:', callState?.status);
      logger.info('- callState.from.id:', callState?.from?.id);
      logger.info('- callState.to.id:', callState?.to?.id);
      logger.info('- user.id:', user?.id);
      logger.info('- isReceivingCall:', isReceivingCall);
      logger.info('- isOutgoingCall:', isOutgoingCall);
      logger.info('- isCallActive:', isCallActive);
      logger.info('- otherUserInCall:', otherUserInCall);
      
      return {
        callState,
        user: user?.id,
        states: {
          isReceivingCall,
          isOutgoingCall,
          isCallActive
        }
      };
    };
    
    (window as any).forceCallActive = () => {
      if (callState) {
        logger.info('🔴 Manually forcing call to ACTIVE state for debugging');
        const activeCall = { ...callState, status: CallStatus.ACTIVE };
        logger.info('Force updating call state to:', activeCall);
        // This would need to trigger the useCallSignaling to update
        // For debugging purposes only
      } else {
        logger.info('⚠️ No call state available to force active');
      }
    };
    
    return () => {
      delete (window as any).debugAppCallState;
      delete (window as any).forceCallActive;
    };
  }, [callState, user, isReceivingCall, isOutgoingCall, isCallActive, otherUserInCall]);

  return (
    <>
      {/* Incoming Call Modal */}
      {isReceivingCall && callState && (
        <CallModal 
          call={callState} 
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
      
      {/* Outgoing Call Modal */}
      {isOutgoingCall && callState && (
        <OutgoingCallModal 
          call={callState} 
          onCancel={handleRejectCall} 
        />
      )}
      
      {/* Active Call Views */}
      {isCallActive && otherUserInCall && user && (
        isAudioCall ? (
          <AudioCallView 
            user={convertToUserType(user)} 
            otherUser={otherUserInCall} 
            onEndCall={handleEndCall}
          />
        ) : (
          <VideoCallView 
          user={convertToUserType(user)}
            otherUser={otherUserInCall} 
          onEndCall={handleEndCall}
          />
        )
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
            <div className={`${isCallActive || isReceivingCall || isOutgoingCall ? 'filter blur-sm' : ''}`}>
              <Layout onInitiateCall={handleInitiateCall} />
            </div>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="connect" element={<Connect />} />
            <Route path="mentees" element={<Mentees />} />
            <Route path="mentors" element={<Mentees />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="messages" element={<EnhancedMessages onInitiateCall={handleInitiateCall} />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="call-history" element={<CallHistoryPage />} />
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