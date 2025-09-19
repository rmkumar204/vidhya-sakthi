import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { MicIcon, PhoneIcon } from './Icons';
import { webRTCService } from '../services/WebRTCService';
import { webSocketService } from '../services/WebSocketService';

interface AudioCallViewProps {
  user: User;
  otherUser: User;
  onEndCall: () => void;
}

const AudioCallView: React.FC<AudioCallViewProps> = ({ user, otherUser, onEndCall }) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true); // Start with voice monitoring enabled

  useEffect(() => {
    const setupCall = async () => {
      try {
        setConnectionStatus('Starting audio...');
        
        // Setup remote stream handler
        webRTCService.onRemoteStream((stream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            setIsConnected(true);
            setConnectionStatus('Connected');
          }
        });
        
        // Setup local audio monitoring for user feedback
        const setupLocalAudio = () => {
          const localStream = webRTCService.getLocalStream();
          if (localStream && localAudioRef.current) {
            localAudioRef.current.srcObject = localStream;
            localAudioRef.current.volume = 0.5; // Higher volume for better feedback
            localAudioRef.current.muted = false; // Start unmuted for immediate feedback
            console.log('🎤 AudioCallView: Local audio stream setup complete with monitoring enabled');
          }
        };
        
        setupLocalAudio();
        
        // Try again after a short delay if stream isn't available immediately
        const localAudioTimeout = setTimeout(() => {
          setupLocalAudio();
        }, 1000);
        
        // Setup call end handler
        webRTCService.onCallEnd(() => {
          onEndCall();
        });
        
        // Setup mute status listener
        const handleMuteStatus = (data: { isMuted: boolean; userId: string }) => {
          if (data.userId !== user.id) {
            setRemoteMuted(data.isMuted);
          }
        };
        
        webSocketService.on('call_mute_status', handleMuteStatus);
        
        setConnectionStatus('Connecting to peer...');
        
        return () => {
          webSocketService.off('call_mute_status', handleMuteStatus);
          if (localAudioTimeout) {
            clearTimeout(localAudioTimeout);
          }
        };
      } catch (err) {
        console.error("Error setting up audio call:", err);
        setConnectionStatus('Connection failed');
        setTimeout(() => onEndCall(), 3000);
      }
    };

    setupCall();

    return () => {
      // Cleanup is handled by the WebRTC service
    };
  }, [onEndCall]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    console.log('🔇 AudioCallView: Toggling mute from', isMuted, 'to', newMutedState);
    
    // Update WebRTC service
    webRTCService.toggleAudio(!newMutedState);
    
    // Update local state
    setIsMuted(newMutedState);
    
    // Send mute status to other user
    if (webSocketService.isConnected()) {
      console.log('📡 AudioCallView: Sending mute status to other user:', { isMuted: newMutedState, userId: user.id });
      webSocketService.sendMuteStatus(otherUser.id, newMutedState, user.id);
    } else {
      console.warn('⚠️ AudioCallView: WebSocket not connected, cannot send mute status');
    }
    
    // Update local audio monitoring
    if (localAudioRef.current) {
      localAudioRef.current.muted = newMutedState || !localAudioEnabled;
    }
    
    console.log('🔊 AudioCallView: Mute state updated:', { 
      isMuted: newMutedState, 
      localAudioEnabled, 
      localAudioMuted: localAudioRef.current?.muted,
      sentToOtherUser: webSocketService.isConnected()
    });
  };

  const toggleLocalAudioMonitoring = () => {
    const newState = !localAudioEnabled;
    console.log('👂 AudioCallView: Toggling local audio monitoring from', localAudioEnabled, 'to', newState);
    
    setLocalAudioEnabled(newState);
    
    if (localAudioRef.current) {
      // Only unmute local audio if we're enabling monitoring AND not muted
      localAudioRef.current.muted = !newState || isMuted;
      localAudioRef.current.volume = newState ? 0.4 : 0; // Increase volume for better feedback
    }
    
    console.log('🔊 AudioCallView: Local audio monitoring updated:', { 
      localAudioEnabled: newState, 
      isMuted, 
      localAudioMuted: localAudioRef.current?.muted,
      volume: localAudioRef.current?.volume
    });
  };

  const handleEndCall = () => {
    console.log('📞 AudioCallView: Ending call manually');
    webRTCService.endCall();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex flex-col items-center justify-center text-white">
      {/* Remote Audio */}
      <audio ref={remoteAudioRef} autoPlay />
      
      {/* Local Audio Monitoring - Enabled by default for voice feedback */}
      <audio 
        ref={localAudioRef} 
        autoPlay 
        muted={!localAudioEnabled || isMuted}
        volume={localAudioEnabled ? 0.5 : 0}
      />
      
      {/* Call Interface */}
      <div className="flex flex-col items-center text-center max-w-md w-full px-8">
        {/* Other User Avatar */}
        <div className="relative mb-8">
          <img 
            src={otherUser.avatarUrl} 
            alt={otherUser.name} 
            className={`w-40 h-40 rounded-full border-4 transition-all duration-300 ${
              isConnected 
                ? 'border-green-400 shadow-lg shadow-green-400/30' 
                : 'border-slate-600 animate-pulse'
            }`}
          />
          {isConnected && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* User Info */}
        <h2 className="text-3xl font-bold mb-2">{otherUser.name}</h2>
        <p className="text-lg text-slate-400 mb-2">{otherUser.role}</p>
        
        {/* Status */}
        <div className="mb-6">
          {isConnected ? (
            <div className="text-center">
              <p className="text-green-400 text-lg font-semibold">Connected</p>
              <p className="text-slate-300 text-xl font-mono">{formatDuration(callDuration)}</p>
              {/* Audio Status Indicator */}
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isMuted ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                }`}></div>
                <span className="text-xs text-slate-400">
                  {isMuted ? 'Microphone Muted' : 'Microphone Active'}
                </span>
                {localAudioEnabled && (
                  <>
                    <div className="w-1 h-1 bg-slate-500 rounded-full mx-1"></div>
                    <span className="text-xs text-green-400">Voice Monitor ON</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-yellow-400 text-lg">{connectionStatus}</p>
          )}
        </div>

        {/* Your Avatar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className={`w-16 h-16 rounded-full border-2 transition-all ${
                isMuted 
                  ? 'border-red-400 opacity-50' 
                  : 'border-slate-400'
              }`}
            />
            <div className="text-left">
              <p className="text-slate-300 font-medium">{user.name}</p>
              <p className="text-slate-500 text-sm">{isMuted ? 'Muted' : 'Speaking'}</p>
            </div>
            {remoteMuted && (
              <div className="ml-4 text-red-400 text-sm font-medium">
                {otherUser.name} is muted
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Mute/Unmute Button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={toggleMute} 
              className={`p-4 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              <MicIcon />
            </button>
            <span className="text-xs text-slate-400">
              {isMuted ? 'Muted' : 'Live'}
            </span>
          </div>
          
          {/* End Call Button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={handleEndCall} 
              className="p-5 rounded-full bg-red-600 hover:bg-red-500 transition-all duration-200 shadow-lg shadow-red-600/30 transform hover:scale-105"
              title="End Call / Hang Up"
            >
              <PhoneIcon />
            </button>
            <span className="text-xs text-red-400 font-medium">
              End Call
            </span>
          </div>
          
          {/* Voice Monitor Button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={toggleLocalAudioMonitoring} 
              className={`p-3 rounded-full transition-all duration-200 text-sm relative ${
                localAudioEnabled 
                  ? 'bg-green-500 shadow-lg shadow-green-500/30 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={localAudioEnabled ? 'Turn Off Voice Monitoring' : 'Turn On Voice Monitoring'}
            >
              👂
              {localAudioEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </button>
            <span className="text-xs text-slate-400">
              {localAudioEnabled ? 'Monitor ON' : 'Monitor OFF'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCallView;