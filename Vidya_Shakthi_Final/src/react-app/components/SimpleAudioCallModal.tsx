import React, { useState, useEffect } from 'react';
import { Call, User } from '../types';
import { useVideoCallFixed } from '../hooks/useVideoCallFixed';

interface SimpleAudioCallModalProps {
  call: Call;
  user: User;
  onEndCall: () => void;
  onClose: () => void;
}

export const SimpleAudioCallModal: React.FC<SimpleAudioCallModalProps> = ({
  call,
  user,
  onEndCall,
  onClose
}) => {
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { 
    callState, 
    incomingCall, 
    callStatus,
    startAudioCall, 
    acceptCall,
    rejectCall,
    endCall, 
    forceCleanup, 
    toggleAudio,
    toggleSpeaker
  } = useVideoCallFixed();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-start call when modal opens
  useEffect(() => {
    const startCall = async () => {
      try {
        console.log('Auto-starting audio call with participants:', call.participants);
        await startAudioCall(call.participants);
      } catch (err: any) {
        console.error('Failed to start audio call:', err);
        setError(err.message || 'Failed to start call. Please check your microphone permissions.');
      }
    };

    startCall();
  }, [call.participants, startAudioCall]);

  const handleEndCall = async () => {
    console.log('SimpleAudioCallModal: Ending call...');
    await forceCleanup();
    onEndCall();
  };

  const handleToggleAudio = () => {
    console.log('Toggling audio...');
    toggleAudio();
  };

  const handleToggleSpeaker = () => {
    console.log('Toggling speaker...');
    toggleSpeaker();
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

  // Handle incoming call
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Incoming {incomingCall.callType} call
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

  // Simple audio call interface
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden flex flex-col min-h-[500px]">
      {/* Close button */}
      <button
        onClick={() => {
          console.log('SimpleAudioCallModal: Close button clicked...');
          handleEndCall();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Simple Top Bar - Just time */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white text-lg font-medium">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-6">
        {/* Large Avatar Display */}
        <div className="text-center w-full">
          <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
            <span className="text-5xl font-bold text-white">👤</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {call.participants[0] || 'Remote Participant'}
          </h2>
          <p className="text-gray-300 text-sm">Audio Call</p>
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

      {/* Simple Bottom Controls - Only essential buttons */}
      <div className="relative bg-gradient-to-t from-black to-transparent p-6 mt-auto">
        <div className="flex items-center justify-center space-x-6">
          {/* Microphone Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-3 rounded-full transition-colors ${
              callState.isAudioEnabled 
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            title={callState.isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {callState.isAudioEnabled ? (
                // Microphone icon (unmuted)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                // Microphone with slash icon (muted)
                <g>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </g>
              )}
            </svg>
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={handleToggleSpeaker}
            className={`p-3 rounded-full transition-colors ${
              callState.isSpeakerOn 
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
            title={callState.isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {callState.isSpeakerOn ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>

          {/* Leave Button */}
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            title="Leave call"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Call Duration */}
      {callState.isInCall && callState.callDuration > 0 && (
        <div className="absolute top-4 right-16 z-10">
          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {formatDuration(callState.callDuration)}
          </span>
        </div>
      )}

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
    </div>
  );
};
