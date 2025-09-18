import React, { useRef, useEffect, useState } from 'react';
import { Call, User } from '../types';

interface AudioCallViewProps {
  call: Call;
  user: User;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  callDuration: number;
  onToggleAudio: () => void;
  onEndCall: () => void;
}

export const AudioCallView: React.FC<AudioCallViewProps> = ({
  call,
  localStream,
  remoteStream,
  isAudioEnabled,
  connectionQuality,
  callDuration,
  onToggleAudio,
  onEndCall
}) => {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Setup local audio stream (for monitoring)
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.volume = 0.1; // Low volume for monitoring
    }
  }, [localStream]);

  // Setup remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Monitor audio levels for visual feedback
  useEffect(() => {
    if (!localStream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255);
      requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
    
    return () => {
      audioContext.close();
    };
  }, [localStream]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get connection quality indicator
  const getQualityIndicator = (quality: string) => {
    switch (quality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center z-50">
      {/* Header with call info and connection status */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-30 text-white p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getQualityIndicator(connectionQuality)}</span>
              <span className={`text-sm ${getQualityColor(connectionQuality)}`}>
                {connectionQuality.toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              {formatDuration(callDuration)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {call.to?.name || call.from?.name || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-300">
              Audio Call
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* User avatar with audio level indicator */}
        <div className="relative">
          <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-6xl font-bold text-white">
              {(call.to?.name || call.from?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Audio level indicator */}
          {isAudioEnabled && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-4 rounded-full transition-all duration-150 ${
                      audioLevel > (i + 1) * 0.2 ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="text-center text-white">
          <h2 className="text-3xl font-semibold mb-2">
            {call.to?.name || call.from?.name || 'Unknown User'}
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300 text-sm">Online</span>
          </div>
        </div>

        {/* Audio status */}
        <div className="text-center text-white">
          <div className="text-sm text-gray-300 mb-2">Audio Status</div>
          <div className={`text-lg font-semibold ${isAudioEnabled ? 'text-green-400' : 'text-red-400'}`}>
            {isAudioEnabled ? 'Connected' : 'Muted'}
          </div>
        </div>
      </div>

      {/* Audio elements (hidden) */}
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-6">
        <div className="flex justify-center items-center space-x-6">
          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isAudioEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>

          {/* End call */}
          <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="End call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCallView;