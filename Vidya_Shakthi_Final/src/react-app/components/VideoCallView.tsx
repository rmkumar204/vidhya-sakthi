import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { MicIcon, VideoCameraIcon, PhoneIcon } from './Icons';
import { webRTCService } from '../services/WebRTCService';
import { webSocketService } from '../services/WebSocketService';

interface VideoCallViewProps {
  user: User;
  otherUser: User;
  onEndCall: () => void;
}

const VideoCallView: React.FC<VideoCallViewProps> = ({ user, otherUser, onEndCall }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // Separate audio element for better control
  const localAudioRef = useRef<HTMLAudioElement>(null); // Local audio monitoring
  const [isMuted, setIsMuted] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true); // Voice monitoring enabled

  useEffect(() => {
    const setupCall = async () => {
      try {
        setConnectionStatus('Starting media...');
        
        // Get local stream from WebRTC service
        const localStream = webRTCService.getLocalStream();
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log('📹 VideoCallView: Local video stream set');
        }
        
        // Setup local audio monitoring for voice feedback
        const setupLocalAudio = () => {
          const localStream = webRTCService.getLocalStream();
          if (localStream && localAudioRef.current) {
            localAudioRef.current.srcObject = localStream;
            localAudioRef.current.volume = 0.3; // Lower volume to avoid feedback
            localAudioRef.current.muted = isMuted; // Respect mute state
            console.log('🎤 VideoCallView: Local audio monitoring setup complete');
          }
        };
        
        setupLocalAudio();
        
        // Retry local audio setup after delay if needed
        setTimeout(setupLocalAudio, 1000);
        
        // Setup remote stream handler with separate audio handling
        webRTCService.onRemoteStream((stream) => {
          console.log('📹 VideoCallView: Remote stream received:', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length
          });
          
          // Set video stream
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            console.log('📹 Remote video stream set');
          }
          
          // Set audio stream separately for better control
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.volume = 1.0; // Full volume for remote audio
            // Ensure audio plays even if autoplay is blocked
            remoteAudioRef.current.play().catch(e => {
              console.warn('⚠️ Remote audio autoplay blocked, user interaction required:', e);
            });
            console.log('🔊 Remote audio stream set with volume:', remoteAudioRef.current.volume);
          }
          
          setIsConnected(true);
          setConnectionStatus('Connected');
          
          // Check if remote stream has video tracks
          const videoTracks = stream.getVideoTracks();
          const hasVideo = videoTracks.length > 0 && videoTracks[0].enabled;
          setRemoteVideoOff(!hasVideo);
          console.log('📹 Remote video status:', { hasVideo, trackCount: videoTracks.length });
        });
        
        // Setup call end handler
        webRTCService.onCallEnd(() => {
          console.log('📞 VideoCallView: Call ended by WebRTC service');
          onEndCall();
        });
        
        // Setup mute status listener
        const handleMuteStatus = (data: { isMuted: boolean; userId: string }) => {
          console.log('🎤 Mute status received:', data);
          if (data.userId !== user.id) {
            setRemoteMuted(data.isMuted);
          }
        };
        
        // Setup video status listener
        const handleVideoStatus = (data: { videoEnabled: boolean; userId: string }) => {
          console.log('📹 Video status received:', data);
          if (data.userId !== user.id) {
            setRemoteVideoOff(!data.videoEnabled);
          }
        };
        
        webSocketService.on('call_mute_status', handleMuteStatus);
        webSocketService.on('call_video_status', handleVideoStatus);
        
        setConnectionStatus('Connecting to peer...');
        
        return () => {
          webSocketService.off('call_mute_status', handleMuteStatus);
          webSocketService.off('call_video_status', handleVideoStatus);
        };
      } catch (err) {
        console.error('❌ Error setting up video call:', err);
        setConnectionStatus('Connection failed');
        setTimeout(() => onEndCall(), 3000);
      }
    };

    setupCall();

    return () => {
      // Cleanup is handled by the WebRTC service
    };
  }, [onEndCall, user.id]);

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
    console.log('🎤 VideoCallView: Toggling mute from', isMuted, 'to', newMutedState);
    
    webRTCService.toggleAudio(!newMutedState);
    setIsMuted(newMutedState);
    
    // Update local audio monitoring
    if (localAudioRef.current) {
      localAudioRef.current.muted = newMutedState;
      console.log('🎤 Local audio monitoring muted:', newMutedState);
    }
    
    // Send mute status to other user
    if (webSocketService.isConnected()) {
      webSocketService.sendMuteStatus(otherUser.id, newMutedState, user.id);
      console.log('📡 Sent mute status to', otherUser.name, ':', newMutedState);
    }
  };
  
  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    console.log('📹 VideoCallView: Toggling video from', isVideoOff, 'to', newVideoState);
    
    webRTCService.toggleVideo(!newVideoState);
    setIsVideoOff(newVideoState);
    
    // Send video status to other user
    if (webSocketService.isConnected()) {
      webSocketService.sendVideoStatus(otherUser.id, newVideoState, user.id);
      console.log('📡 Sent video status to', otherUser.name, ':', !newVideoState);
    }
  };

  const toggleLocalAudioMonitoring = () => {
    const newState = !localAudioEnabled;
    setLocalAudioEnabled(newState);
    
    if (localAudioRef.current) {
      localAudioRef.current.muted = !newState || isMuted;
      localAudioRef.current.volume = newState ? 0.3 : 0;
    }
    
    console.log('🔊 VideoCallView: Local audio monitoring updated:', { 
      localAudioEnabled: newState, 
      isMuted, 
      volume: localAudioRef.current?.volume
    });
  };

  const handleEndCall = () => {
    console.log('📞 VideoCallView: Ending call manually');
    webRTCService.endCall();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-white">
      {/* Remote Audio - Separate element for better audio control */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      
      {/* Local Audio Monitoring for voice feedback */}
      <audio 
        ref={localAudioRef} 
        autoPlay 
        playsInline
        muted={!localAudioEnabled || isMuted}
        volume={localAudioEnabled ? 0.3 : 0}
      />
      
      {/* Remote Video */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isConnected && !remoteVideoOff ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : isConnected && remoteVideoOff ? (
          <div className="flex flex-col items-center text-center bg-slate-800 p-8 rounded-lg shadow-2xl">
            <img 
              src={otherUser.avatarUrl} 
              alt={otherUser.name} 
              className="w-40 h-40 rounded-full mb-4 border-4 border-slate-600"
            />
            <h2 className="text-3xl font-bold">{otherUser.name}</h2>
            <p className="text-slate-400 mt-2">Camera is off</p>
            {remoteMuted && (
              <p className="text-red-400 mt-1 flex items-center gap-1">
                <MicIcon className="w-4 h-4" /> Microphone muted
              </p>
            )}
            <p className="text-green-400 text-lg font-mono mt-2">{formatDuration(callDuration)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center bg-slate-800 p-8 rounded-lg">
            <img 
              src={otherUser.avatarUrl} 
              alt={otherUser.name} 
              className="w-32 h-32 rounded-full mb-4 border-4 border-slate-600 animate-pulse"
            />
            <h2 className="text-3xl font-bold">{otherUser.name}</h2>
            <p className="text-slate-400 mt-2">{connectionStatus}</p>
          </div>
        )}
        
        {/* Call Duration Overlay */}
        {isConnected && !remoteVideoOff && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
          </div>
        )}
        
        {/* Remote User Mute Indicator */}
        {isConnected && !remoteVideoOff && remoteMuted && (
          <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <MicIcon className="w-4 h-4" />
            <span className="text-white text-sm">{otherUser.name} muted</span>
          </div>
        )}
        
        {/* Local User Voice Monitoring Indicator */}
        {isConnected && (localAudioEnabled || isMuted) && (
          <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            {localAudioEnabled && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-xs">Voice Monitor</span>
              </div>
            )}
            {isMuted && (
              <div className="flex items-center gap-1">
                <MicIcon className="w-3 h-3 text-red-400" />
                <span className="text-red-400 text-xs">Muted</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local Video Preview */}
      {!isVideoOff ? (
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute bottom-5 right-5 w-64 h-48 rounded-lg object-cover border-2 border-slate-500"
        />
      ) : (
        <div className="absolute bottom-5 right-5 w-64 h-48 rounded-lg bg-slate-800 border-2 border-slate-500 flex items-center justify-center">
          <div className="text-center">
            <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full mx-auto mb-2"/>
            <p className="text-sm text-slate-400">Camera Off</p>
            {isMuted && (
              <p className="text-red-400 text-xs mt-1 flex items-center justify-center gap-1">
                <MicIcon className="w-3 h-3" /> Muted
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-4 bg-slate-800/50 backdrop-blur-sm p-4 rounded-full">
        {/* Mute Button */}
        <div className="relative">
          <button 
            onClick={toggleMute} 
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500' : 'bg-slate-600 hover:bg-slate-500'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <MicIcon />
          </button>
          {isMuted && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              You're muted
            </div>
          )}
        </div>
        
        {/* Voice Monitor Button */}
        <button 
          onClick={toggleLocalAudioMonitoring}
          className={`p-3 rounded-full transition-colors ${
            localAudioEnabled ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-600 hover:bg-slate-500'
          }`}
          title={localAudioEnabled ? 'Disable voice monitoring' : 'Enable voice monitoring'}
        >
          <div className="w-4 h-4 relative">
            <div className={`w-full h-full rounded-full ${
              localAudioEnabled ? 'bg-white animate-pulse' : 'bg-gray-400'
            }`}></div>
          </div>
        </button>
        
        {/* Video Button */}
        <button 
          onClick={toggleVideo} 
          className={`p-4 rounded-full transition-colors ${
            isVideoOff ? 'bg-red-500' : 'bg-slate-600 hover:bg-slate-500'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          <VideoCameraIcon />
        </button>
        
        {/* End Call Button */}
        <button 
          onClick={handleEndCall} 
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
          title="End call"
        >
          <PhoneIcon />
        </button>
      </div>
    </div>
  );
};

export default VideoCallView;