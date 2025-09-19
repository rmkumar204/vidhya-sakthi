import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Call, User } from '../types';
import { formatDuration } from '../utils/formatters';
import { useWebRTC } from '../hooks/useWebRTC';
import { Icon } from './ui/Icon';

interface VideoCallModalProps {
  call: Call;
  user: User;
  onEndCall: () => void;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  call,
  user,
  onEndCall,
  onClose
}) => {
  const [error, setError] = useState<string | null>(null);

  const { callState, startVideoCall, endCall, forceCleanup, toggleAudio, toggleVideo, toggleScreenShare } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-start call when modal opens
  useEffect(() => {
    const startCall = async () => {
      try {
        await startVideoCall(call.participants);
      } catch (err) {
        setError('Failed to start call. Please check your camera and microphone permissions.');
      }
    };

    startCall();

    return () => {
      console.log('VideoCallModal: useEffect cleanup - ending call...');
      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.pause();
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.pause();
      }
      // Use force cleanup to ensure all media streams are stopped
      forceCleanup();
    };
  }, [call.participants, startVideoCall, forceCleanup]);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [callState.localStream]);

  // Update remote video when remote streams change
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStreams.size > 0) {
      const [firstStream] = callState.remoteStreams.values();
      remoteVideoRef.current.srcObject = firstStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [callState.remoteStreams]);

  const handleEndCall = () => {
    console.log('VideoCallModal: Ending call...');
    
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
    forceCleanup();
    onEndCall();
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleToggleScreenShare = () => {
    toggleScreenShare();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-6xl mx-auto">
        {/* Close button */}
        <button
          onClick={() => {
            // Close modal and cleanup
            handleEndCall();
            onClose();
          }}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          <Icon name="x" className="w-6 h-6 text-white" />
        </button>

        {/* Main video area */}
        <div className="relative w-full h-full">
          {/* Remote video (main) */}
          <div className="absolute inset-0 bg-gray-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Demo mode indicator */}
            {callState.connectionStatus === 'connected' && callState.remoteStreams.size === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="video" className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white text-lg mb-2">Demo Mode</p>
                  <p className="text-gray-400">Waiting for remote participant...</p>
                  <p className="text-gray-500 text-sm mt-2">In a real implementation, this would show the remote video</p>
                </div>
              </div>
            )}
            
            {/* Connection status overlay */}
            {callState.connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg">Connecting...</p>
                </div>
              </div>
            )}
            
            {(error || callState.error) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center max-w-md mx-auto px-4">
                  <Icon name="x" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Connection Error</p>
                  <p className="text-gray-400 mb-4">{error || callState.error}</p>
                  
                  {/* Troubleshooting tips */}
                  <div className="text-left text-sm text-gray-500 bg-gray-800 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Troubleshooting:</p>
                    <ul className="space-y-1">
                      <li>• Make sure you're using HTTPS or localhost</li>
                      <li>• Check browser permissions for camera/microphone</li>
                      <li>• Ensure no other app is using your camera</li>
                      <li>• Try refreshing the page</li>
                    </ul>
                  </div>
                  
                  {/* Retry button */}
                  <button
                    onClick={() => {
                      setError(null);
                      // Retry the call
                      const startCall = async () => {
                        try {
                          await startVideoCall(call.participants);
                        } catch (err) {
                          setError('Failed to start call. Please check your camera and microphone permissions.');
                        }
                      };
                      startCall();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          {callState.localStream && callState.isVideoEnabled && (
            <div className="absolute top-4 left-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call info */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-4 text-white">
              <div className="text-center">
                <p className="text-sm text-gray-400">Call Duration</p>
                <p className="font-mono text-lg">{formatDuration(callState.callDuration)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-sm capitalize">{callState.connectionStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 bg-gray-800 bg-opacity-75 rounded-full px-6 py-4">
            {/* Audio toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-3 rounded-full transition-colors ${
                callState.isAudioEnabled
                  ? 'bg-gray-600 hover:bg-gray-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              <Icon
                name={callState.isAudioEnabled ? "mic" : "mic-off"}
                className="w-6 h-6 text-white"
              />
            </button>

            {/* Video toggle */}
            <button
              onClick={handleToggleVideo}
              className={`p-3 rounded-full transition-colors ${
                callState.isVideoEnabled
                  ? 'bg-gray-600 hover:bg-gray-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              <Icon
                name={callState.isVideoEnabled ? "video" : "video-off"}
                className="w-6 h-6 text-white"
              />
            </button>

            {/* Screen share */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3 rounded-full transition-colors ${
                callState.isScreenSharing
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <Icon name="screen-share" className="w-6 h-6 text-white" />
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="p-3 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
            >
              <Icon name="phone-hangup" className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
