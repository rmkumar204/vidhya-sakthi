import React, { useState, useRef, useEffect } from 'react';
import { Call, User } from '../types';
import { useWebRTCReal } from '../hooks/useWebRTCReal';
import { useWebRTCDemo } from '../hooks/useWebRTCDemo';

interface TeamsAudioCallModalProps {
  call: Call;
  user: User;
  onEndCall: () => void;
  onClose: () => void;
}

export const TeamsAudioCallModal: React.FC<TeamsAudioCallModalProps> = ({
  call,
  user,
  onEndCall,
  onClose
}) => {
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [participants, setParticipants] = useState([
    {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isAudioEnabled: true
    }
  ]);

  // Use demo mode by default for testing
  const { 
    callState, 
    incomingCall, 
    callStatus,
    startAudioCall, 
    acceptCall,
    rejectCall,
    endCall, 
    forceCleanup, 
    toggleAudio
  } = useWebRTCDemo();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-start call when modal opens (if not incoming call)
  useEffect(() => {
    if (!incomingCall && callStatus === 'idle') {
      const startCall = async () => {
        try {
          await startAudioCall(call.participants);
          // Add remote participants
          const remoteParticipants = call.participants.map(id => ({
            id,
            name: `User ${id}`,
            avatar: '👤',
            isAudioEnabled: true
          }));
          setParticipants(prev => [...prev, ...remoteParticipants]);
        } catch (err) {
          setError('Failed to start call. Please check your microphone permissions.');
        }
      };

      startCall();
    }
  }, [call.participants, startAudioCall, incomingCall, callStatus]);

  const handleEndCall = () => {
    console.log('TeamsAudioCallModal: Ending call...');
    forceCleanup();
    onEndCall();
  };

  const handleToggleAudio = () => {
    toggleAudio();
    setParticipants(prev => prev.map(p => 
      p.id === user.id ? { ...p, isAudioEnabled: !p.isAudioEnabled } : p
    ));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const currentUser = participants.find(p => p.id === user.id);
  const remoteParticipants = participants.filter(p => p.id !== user.id);

  // Handle incoming call
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Incoming audio call
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {incomingCall.from} is calling you
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                title="Decline call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
                title="Accept call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Teams-like audio call interface
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col z-50">
      {/* Top Bar - Teams Style */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Left Side - Time and Security */}
        <div className="flex items-center space-x-3">
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {formatTime(currentTime)}
          </span>
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Right Side - Call Controls */}
        <div className="flex items-center space-x-2">
          {/* People Button */}
          <button
            className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="People"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {participants.length}
              </span>
            </div>
          </button>

          {/* More Options */}
          <button
            className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Microphone Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-2 rounded-lg transition-colors ${
              currentUser?.isAudioEnabled 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            title={currentUser?.isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {currentUser?.isAudioEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>

          {/* Leave Button */}
          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Leave"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Main Avatar Area */}
        <div className="text-center">
          <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-8">
            <span className="text-6xl font-bold text-white">
              {remoteParticipants[0]?.avatar || '👤'}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {remoteParticipants[0]?.name || 'Remote Participant'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Audio call in progress
          </p>

          {/* Call Duration */}
          {callState.isInCall && callState.callDuration > 0 && (
            <div className="text-3xl font-mono text-gray-900 dark:text-white mb-8">
              {formatDuration(callState.callDuration)}
            </div>
          )}

          {/* Call Status */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {callStatus === 'connected' ? 'Connected' : 
               callStatus === 'connecting' ? 'Connecting...' : 
               callStatus === 'ringing' ? 'Ringing...' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Call Status Overlay */}
        {callStatus === 'ringing' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-pulse mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Calling...</h3>
              <p className="text-gray-300">Waiting for answer</p>
            </div>
          </div>
        )}

        {callStatus === 'connecting' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
              <p className="text-gray-300">Establishing connection</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar - Call Duration and Status */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {remoteParticipants[0]?.name || 'Remote Participant'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>• Check your microphone permissions</p>
              <p>• Ensure you're using HTTPS or localhost</p>
              <p>• Try refreshing the page</p>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setError(null)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleEndCall}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
