import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Call, User } from '../types';
import { formatDuration } from '../utils/formatters';
import { useWebRTC } from '../hooks/useWebRTC';
import { Icon } from './ui/Icon';

interface AudioCallModalProps {
  call: Call;
  user: User;
  onEndCall: () => void;
  onClose: () => void;
}

export const AudioCallModal: React.FC<AudioCallModalProps> = ({
  call,
  user,
  onEndCall,
  onClose
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { callState, startAudioCall, endCall, forceCleanup, toggleAudio } = useWebRTC();

  // Auto-start call when modal opens
  useEffect(() => {
    const startCall = async () => {
      try {
        await startAudioCall(call.participants);
      } catch (err) {
        setError('Failed to start call. Please check your microphone permissions.');
      }
    };

    startCall();

    return () => {
      // Cleanup call components
      forceCleanup();
    };
  }, [call.participants, startAudioCall, forceCleanup]);

  const handleEndCall = () => {
    // End call and cleanup
    forceCleanup();
    onEndCall();
  };

  const handleToggleMute = () => {
    toggleAudio();
    setIsMuted(!isMuted);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full max-w-md mx-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          <Icon name="x" className="w-6 h-6 text-white" />
        </button>

        {/* Main content */}
        <div className="bg-gray-800 rounded-2xl p-8 text-center">
          {/* Avatar */}
          <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="phone" className="w-16 h-16 text-white" />
          </div>

          {/* Call info */}
          <h2 className="text-2xl font-bold text-white mb-2">Audio Call</h2>
          <p className="text-gray-400 mb-2">
            {callState.connectionStatus === 'connecting' && 'Connecting...'}
            {callState.connectionStatus === 'connected' && 'Connected'}
            {callState.connectionStatus === 'disconnected' && 'Disconnected'}
          </p>
          {callState.connectionStatus === 'connected' && (
            <p className="text-gray-500 text-sm mb-6">Demo Mode - Local audio only</p>
          )}

          {/* Call duration */}
          {callState.isInCall && (
            <div className="mb-6">
              <p className="text-3xl font-mono text-white">{formatDuration(callState.callDuration)}</p>
            </div>
          )}

          {/* Error message */}
          {(error || callState.error) && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-lg">
              <p className="text-red-400">{error || callState.error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6">
            {/* Mute toggle */}
            <button
              onClick={handleToggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <Icon
                name={isMuted ? "mic-off" : "mic"}
                className="w-6 h-6 text-white"
              />
            </button>

            {/* Speaker toggle */}
            <button
              onClick={handleToggleSpeaker}
              className={`p-4 rounded-full transition-colors ${
                isSpeakerOn
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <Icon
                name={isSpeakerOn ? "volume-up" : "volume-off"}
                className="w-6 h-6 text-white"
              />
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="p-4 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
            >
              <Icon name="phone-hangup" className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Status indicators */}
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isMuted ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span className="text-gray-400">
                {isMuted ? 'Muted' : 'Unmuted'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isSpeakerOn ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-gray-400">
                {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
