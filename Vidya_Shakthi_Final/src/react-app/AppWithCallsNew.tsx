import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { useAuth } from "@/react-app/hooks/useAuth";
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
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
import ProtectedRoute from "./components/ProtectedRoute";

// Call components
import MinimizableCallModal from "@/react-app/components/MinimizableCallModal";
import { RobustVideoCallModal } from "@/react-app/components/RobustVideoCallModal";

// New unified call system
import { useCall } from "@/react-app/hooks/useCall";
import { getUserData } from "@/react-app/services/UserService";

// Import proper types
import { User as UserType, Call as CallType } from "@/react-app/types";

// Call Management Component (inside AuthProvider)
const CallManager: React.FC = () => {
  const { user } = useAuth();
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  
  // Use the new unified call hook
  const {
    currentCall,
    isInCall,
    isConnecting,
    isRinging,
    isConnected,
    incomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    callDuration,
    connectionQuality,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    remoteStreams,
    error,
    clearError
  } = useCall();

  // Helper function to get user display name
  const getUserDisplayNameLocal = async (userId: string, fallbackName?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = await getUserData(userId, token || undefined);
      return userData?.name || fallbackName || 'Unknown User';
    } catch (error) {
      logger.error('Failed to get user name:', error);
      return fallbackName || 'Unknown User';
    }
  };

  // Convert user to proper format
  const convertToUserType = (user: any): UserType => ({
    id: user.id,
    name: user.name || user.email || 'Unknown User',
    email: user.email || '',
    role: user.role || 'mentee',
    avatarUrl: user.avatarUrl || '',
    isOnline: true
  });

  // Convert call to proper format for modals
  const convertToCallType = (call: any): CallType => ({
    id: call.id,
    type: call.type,
    status: call.status as any,
    from: {
      id: call.participants[0]?.id || '',
      name: call.participants[0]?.name || 'Unknown User',
      email: '',
      role: 'mentee',
      avatarUrl: '',
      isOnline: true
    },
    to: {
      id: call.participants[1]?.id || '',
      name: call.participants[1]?.name || 'Unknown User',
      email: '',
      role: 'mentee',
      avatarUrl: '',
      isOnline: true
    },
    startTime: call.startTime,
    endTime: call.endTime,
    duration: call.duration,
    participants: call.participants.map((p: any) => p.id)
  });

  // Handle call initiation
  const handleInitiateCall = async (toUserId: string, callType: 'audio' | 'video') => {
    try {
      const toUserName = await getUserDisplayNameLocal(toUserId);
      const fromUserName = user?.name || 'You';
      
      const participants = [
        { id: user?.id || '', name: fromUserName, isOnline: true },
        { id: toUserId, name: toUserName, isOnline: true }
      ];

      await initiateCall(toUserId, callType, participants);
    } catch (error) {
      logger.error('Failed to initiate call:', error);
    }
  };

  // Handle call acceptance
  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      await acceptCall(
        incomingCall.callId,
        incomingCall.fromUserId,
        incomingCall.offer,
        incomingCall.callType,
        incomingCall.participants
      );
    } catch (error) {
      logger.error('Failed to accept call:', error);
    }
  };

  // Handle call rejection
  const handleRejectCall = async () => {
    if (!incomingCall) return;
    
    try {
      await rejectCall(incomingCall.callId, incomingCall.fromUserId);
    } catch (error) {
      logger.error('Failed to reject call:', error);
    }
  };

  // Handle call end
  const handleEndCall = async () => {
    try {
      await endCall();
    } catch (error) {
      logger.error('Failed to end call:', error);
    }
  };

  // Handle minimize/maximize
  const handleMinimizeCall = () => {
    setIsCallMinimized(true);
  };

  const handleMaximizeCall = () => {
    setIsCallMinimized(false);
  };

  // Determine call states
  const isReceivingCall = incomingCall !== null;
  const isOutgoingCall = currentCall && currentCall.status === 'ringing' && !isReceivingCall;
  // Enhanced: Also check for 'active' status for calls that have been accepted
  const isAudioCallActive = currentCall && 
    (currentCall.status === 'connected' || currentCall.status === 'active') && 
    currentCall.type === 'audio';
  const isVideoCallActive = currentCall && 
    (currentCall.status === 'connected' || currentCall.status === 'active') && 
    currentCall.type === 'video';
  const isVideoCallRequest = (incomingCall && incomingCall.callType === 'video') || 
                            (currentCall && currentCall.type === 'video' && currentCall.status === 'ringing');
  
  logger.info('🔍 CallManager: Current call states:', {
    isReceivingCall,
    isOutgoingCall, 
    isAudioCallActive,
    isVideoCallActive,
    currentCallStatus: currentCall?.status,
    incomingCallExists: !!incomingCall
  });

  return (
    <div className="h-screen flex flex-col">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={clearError}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route path="/app" element={
          <div className={`${isInCall ? 'filter blur-sm' : ''}`}>
            <Layout onInitiateCall={handleInitiateCall} />
          </div>
        }>
          <Route path="dashboard" element={<Dashboard />} />
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
        </Route>
      </Routes>

      {/* Call Modals */}
      
      {/* Audio Call Modal - Enhanced with duration and controls */}
      {(isReceivingCall || isOutgoingCall || isAudioCallActive) && user && (currentCall || incomingCall) && (currentCall?.type === 'audio' || incomingCall?.callType === 'audio') && !isVideoCallRequest && (
        <MinimizableCallModal
          call={currentCall ? convertToCallType(currentCall) : (incomingCall ? {
            id: incomingCall.callId,
            type: incomingCall.callType,
            status: 'ringing' as any,
            from: {
              id: incomingCall.fromUserId,
              name: incomingCall.participants.find(p => p.id === incomingCall.fromUserId)?.name || 'Unknown User',
              email: '',
              role: 'mentee',
              avatarUrl: '',
              isOnline: true
            },
            to: {
              id: user.id,
              name: user.name || 'You',
              email: user.email || '',
              role: user.role || 'mentee',
              avatarUrl: '',
              isOnline: true
            },
            startTime: new Date(),
            participants: incomingCall.participants.map(p => p.id)
          } : null)}
          user={convertToUserType(user)}
          callType="audio"
          isIncoming={isReceivingCall && !isAudioCallActive}
          localStream={localStream}
          remoteStream={Array.from(remoteStreams.values())[0] || null}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          connectionQuality={connectionQuality}
          callDuration={callDuration}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEndCall={handleEndCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={async () => {
            try {
              if (isScreenSharing) {
                await stopScreenShare();
              } else {
                await startScreenShare();
              }
            } catch (error) {
              logger.error('Screen sharing toggle failed:', error);
            }
          }}
          onMinimize={handleMinimizeCall}
          onMaximize={handleMaximizeCall}
          isMinimized={isCallMinimized}
        />
      )}

      {/* Video Call Request Modal - Show request UI for both incoming and outgoing video calls */}
      {isVideoCallRequest && !isVideoCallActive && user && (incomingCall || currentCall) && (
        <MinimizableCallModal
          call={currentCall ? convertToCallType(currentCall) : (incomingCall ? {
            id: incomingCall.callId,
            type: incomingCall.callType,
            status: 'ringing' as any,
            from: {
              id: incomingCall.fromUserId,
              name: incomingCall.participants.find(p => p.id === incomingCall.fromUserId)?.name || 'Unknown User',
              email: '',
              role: 'mentee',
              avatarUrl: '',
              isOnline: true
            },
            to: {
              id: user.id,
              name: user.name || 'You',
              email: user.email || '',
              role: user.role || 'mentee',
              avatarUrl: '',
              isOnline: true
            },
            startTime: new Date(),
            participants: incomingCall.participants.map(p => p.id)
          } : null)}
          user={convertToUserType(user)}
          callType="video"
          isIncoming={isReceivingCall}
          localStream={localStream}
          remoteStream={Array.from(remoteStreams.values())[0] || null}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          connectionQuality={connectionQuality}
          callDuration={callDuration}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEndCall={handleEndCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={async () => {
            try {
              if (isScreenSharing) {
                await stopScreenShare();
              } else {
                await startScreenShare();
              }
            } catch (error) {
              logger.error('Screen sharing toggle failed:', error);
            }
          }}
          onMinimize={handleMinimizeCall}
          onMaximize={handleMaximizeCall}
          isMinimized={isCallMinimized}
        />
      )}

      {/* Video Call Modal - Robust video call interface (only when call is active) */}
      {isVideoCallActive && user && currentCall && (
        <RobustVideoCallModal
          call={convertToCallType(currentCall)}
          user={convertToUserType(user)}
          onEndCall={handleEndCall}
          onClose={() => {
            // Call cleanup is handled by the service
          }}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ProtectedRoute>
            <CallManager />
          </ProtectedRoute>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
