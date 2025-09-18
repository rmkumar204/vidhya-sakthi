import React, { useState, useRef, useEffect } from 'react';
import { Call, User } from '../types';
import { useVideoCallRobust } from '../hooks/useVideoCallRobust';

interface RobustVideoCallModalProps {
  call: Call;
  user: User;
  onEndCall: () => void;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export const RobustVideoCallModal: React.FC<RobustVideoCallModalProps> = ({
  call,
  user,
  onEndCall,
  onClose,
  onAccept,
  onReject
}) => {
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');
  const [isReconnecting, setIsReconnecting] = useState(false);

  const { 
    callState, 
    incomingCall, 
    callStatus,
    startVideoCall, 
    acceptCall,
    rejectCall,
    endCall, 
    forceCleanup, 
    toggleAudio, 
    toggleVideo, 
    toggleScreenShare 
  } = useVideoCallRobust();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
        console.log('Auto-starting robust call with participants:', call.participants);
        await startVideoCall(call.participants);
      } catch (err: any) {
        console.error('Failed to start call:', err);
        setError(err.message || 'Failed to start call. Please check your camera and microphone permissions.');
      }
    };

    startCall();
  }, [call.participants, startVideoCall]);

  // Update local video when stream changes
  useEffect(() => {
    console.log('Robust video stream effect triggered:', {
      hasVideoRef: !!localVideoRef.current,
      hasStream: !!callState.localStream,
      isVideoEnabled: callState.isVideoEnabled,
      streamTracks: callState.localStream?.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      }))
    });

    if (localVideoRef.current) {
      if (callState.localStream && callState.isVideoEnabled) {
        console.log('Setting robust local video stream');
        localVideoRef.current.srcObject = callState.localStream;
        localVideoRef.current.play().catch(console.error);
      } else {
        console.log('Clearing robust local video stream');
        localVideoRef.current.srcObject = null;
        localVideoRef.current.pause();
      }
    }
  }, [callState.localStream, callState.isVideoEnabled]);

  // Update remote video when remote streams change
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStreams.size > 0) {
      console.log('Setting robust remote video stream');
      const [firstStream] = callState.remoteStreams.values();
      remoteVideoRef.current.srcObject = firstStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [callState.remoteStreams]);

  const handleEndCall = async () => {
    console.log('RobustVideoCallModal: Ending call...');
    
    // Clear video elements first
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
    }
    
    // Use force cleanup to ensure all media streams are stopped
    await forceCleanup();
    onEndCall();
  };

  const handleToggleAudio = () => {
    console.log('Toggling robust audio...');
    toggleAudio();
  };

  const handleToggleVideo = async () => {
    console.log('Toggling robust video...');
    try {
      await toggleVideo();
    } catch (error: any) {
      console.error('Error toggling robust video:', error);
      setError(error.message || 'Failed to toggle video');
    }
  };

  const handleToggleScreenShare = () => {
    console.log('Toggling robust screen share...');
    toggleScreenShare();
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
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">
                {incomingCall.from ? incomingCall.from.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Incoming {incomingCall.callType} call
            </h2>
            <p className="text-slate-400">
              {incomingCall.from || 'Unknown User'} is calling you
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onReject || rejectCall}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Decline call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={onAccept || acceptCall}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Accept call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Robust video call interface
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto bg-black rounded-lg overflow-hidden flex flex-col">
      {/* Close button */}
      <button
        onClick={() => {
          console.log('RobustVideoCallModal: Close button clicked...');
          handleEndCall();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Enhanced Top Bar - Time and Connection Quality */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
        <span className="text-white text-lg font-medium">
          {formatTime(currentTime)}
        </span>
        
        {/* Connection Quality Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionQuality === 'excellent' ? 'bg-green-500' :
            connectionQuality === 'good' ? 'bg-yellow-500' :
            connectionQuality === 'fair' ? 'bg-orange-500' : 'bg-red-500'
          }`}></div>
          <span className="text-white text-sm capitalize">
            {connectionQuality}
          </span>
        </div>

        {/* Reconnection Indicator */}
        {isReconnecting && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-sm">Reconnecting...</span>
          </div>
        )}
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* Remote Video or Avatar */}
        {callState.remoteStreams.size > 0 && callState.isVideoEnabled ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
                <span className="text-6xl font-bold text-white">
                  {(call.to?.name || call.from?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {call.to?.name || call.from?.name || 'Unknown User'}
              </h2>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-400 text-sm">Online</span>
              </div>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callState.localStream && callState.isVideoEnabled && (
          <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-white z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Local Video Disabled Indicator */}
        {callState.localStream && !callState.isVideoEnabled && (
          <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg shadow-lg border-2 border-red-500 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <p className="text-sm text-red-500">Camera Off</p>
            </div>
          </div>
        )}

        {/* Separate Audio Elements for Better Control */}
        {callState.remoteStreams.size > 0 && (
          <audio
            autoPlay
            playsInline
            className="hidden"
            ref={(audio) => {
              if (audio && callState.remoteStreams.size > 0) {
                const remoteStream = Array.from(callState.remoteStreams.values())[0];
                if (remoteStream && audio.srcObject !== remoteStream) {
                  audio.srcObject = remoteStream;
                }
              }
            }}
          />
        )}

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
          {/* Camera Toggle */}
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              callState.isVideoEnabled 
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            title={callState.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {callState.isVideoEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              )}
            </svg>
          </button>

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              callState.isScreenSharing 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
            }`}
            title={callState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

      {/* Debug Info */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs">
          <span className="text-green-400">ROBUST</span> | 
          Video: {callState.isVideoEnabled ? 'ON' : 'OFF'} | 
          Stream: {callState.localStream ? 'YES' : 'NO'} | 
          Track: {callState.localStream?.getVideoTracks()[0]?.enabled ? 'ENABLED' : 'DISABLED'}
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
              <p>• Check your camera and microphone permissions</p>
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
