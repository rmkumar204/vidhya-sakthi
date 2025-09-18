import React, { useRef, useEffect, useState } from 'react';
import {
  PhoneIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

interface AudioCallViewProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  callDuration: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  onToggleAudio: () => void;
  onEndCall: () => void;
  remoteUserName?: string;
}

const AudioCallView: React.FC<AudioCallViewProps> = ({
  localStream,
  remoteStream,
  isAudioEnabled,
  callDuration,
  connectionStatus,
  onToggleAudio,
  onEndCall,
  remoteUserName = 'Remote User'
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [localVolume, setLocalVolume] = useState(0);

  // Setup remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Setup local audio stream for monitoring
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Monitor local audio volume
  useEffect(() => {
    if (!localStream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setLocalVolume(average);
      requestAnimationFrame(updateVolume);
    };
    
    updateVolume();

    return () => {
      audioContext.close();
    };
  }, [localStream]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get volume bar height
  const getVolumeBarHeight = (volume: number) => {
    return Math.max(4, (volume / 255) * 100);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/30 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <div>
              <h2 className="text-white text-xl font-semibold">Audio Call</h2>
              <p className={`text-sm ${getConnectionStatusColor()}`}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'failed' ? 'Connection Failed' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="text-white text-lg font-mono">
            {formatDuration(callDuration)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {/* Remote User Avatar */}
          <div className="relative mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-8xl text-white">👤</span>
            </div>
            
            {/* Connection Status Ring */}
            <div className={`absolute inset-0 rounded-full border-4 ${
              connectionStatus === 'connected' ? 'border-green-500' : 
              connectionStatus === 'connecting' ? 'border-yellow-500 animate-pulse' : 
              'border-red-500'
            }`}></div>
            
            {/* Audio Level Indicator */}
            {connectionStatus === 'connected' && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className="w-1 bg-green-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${bar * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remote User Name */}
          <h1 className="text-3xl font-bold text-white mb-2">{remoteUserName}</h1>
          <p className="text-blue-200 text-lg">Audio Call</p>

          {/* Local Audio Monitor */}
          {localStream && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2 bg-black/30 rounded-full px-4 py-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        localVolume > (bar * 50) ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                      style={{
                        height: `${getVolumeBarHeight(localVolume)}px`
                      }}
                    />
                  ))}
                </div>
                <span className="text-white text-sm ml-2">Your Voice</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-8">
        <div className="flex items-center justify-center space-x-6">
          {/* Speaker Toggle */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isSpeakerOn 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
          >
            {isSpeakerOn ? (
              <SpeakerWaveIcon className="w-7 h-7" />
            ) : (
              <SpeakerXMarkIcon className="w-7 h-7" />
            )}
          </button>

          {/* Audio Toggle */}
          <button
            onClick={onToggleAudio}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? (
              <MicrophoneIcon className="w-8 h-8" />
            ) : (
              <SpeakerXMarkIcon className="w-8 h-8" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            title="End call"
          >
            <PhoneIcon className="w-8 h-8 rotate-45" />
          </button>
        </div>

        {/* Audio Quality Indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2 bg-black/30 rounded-full px-4 py-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 h-4 rounded-full ${
                    connectionStatus === 'connected' && bar <= 4
                      ? 'bg-green-500'
                      : connectionStatus === 'connecting' && bar <= 2
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
              ))}
            </div>
            <span className="text-white text-sm ml-2">Audio Quality</span>
          </div>
        </div>
      </div>

      {/* Hidden Audio Elements */}
      {remoteStream && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      )}
      
      {localStream && (
        <audio
          ref={localAudioRef}
          autoPlay
          playsInline
          muted={true}
          className="hidden"
        />
      )}
    </div>
  );
};

export default AudioCallView;