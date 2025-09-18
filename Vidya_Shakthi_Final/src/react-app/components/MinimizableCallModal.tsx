import React, { useState, useRef, useEffect } from 'react';
import { Call, User } from '../types';

interface MinimizableCallModalProps {
  call: Call;
  user: User;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  callDuration: number;
  onAccept?: () => void;
  onReject?: () => void;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMinimized?: boolean;
}

export const MinimizableCallModal: React.FC<MinimizableCallModalProps> = ({
  call,
  user,
  callType,
  isIncoming,
  localStream,
  remoteStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  connectionQuality,
  callDuration,
  onAccept,
  onReject,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onMinimize,
  onMaximize,
  isMinimized = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  // Setup audio streams
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.volume = 0.1;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === modalRef.current || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityIndicator = (quality: string) => {
    switch (quality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  // Don't render if call is null
  if (!call) {
    return null;
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 cursor-move"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center p-3 space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {isIncoming ? (call?.from?.name || 'U').charAt(0).toUpperCase() : (call?.to?.name || call?.from?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Call info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {isIncoming ? (call?.from?.name || 'Unknown User') : (call?.to?.name || call?.from?.name || 'Unknown User')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {call?.status === 'connected' ? `Duration: ${formatDuration(callDuration)}` : 
               call?.status === 'ringing' ? 'Ringing...' :
               call?.status === 'rejected' ? 'Call rejected' : 'Call ended'}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onMaximize}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Maximize"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={onEndCall}
              className="p-1 text-red-500 hover:text-red-600"
              title="End call"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          {/* Minimize button */}
          <button
            onClick={onMinimize}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          {/* Avatar */}
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">
              {isIncoming ? (call?.from?.name || 'U').charAt(0).toUpperCase() : (call?.to?.name || call?.from?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Call info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {isIncoming ? 'Incoming' : 'Calling'} {isIncoming ? (call?.from?.name || 'Unknown User') : (call?.to?.name || call?.from?.name || 'Unknown User')}
            </h2>
            <p className="text-blue-100">
              {isIncoming ? 'Incoming' : 'Outgoing'} {callType} call
            </p>
            {!isIncoming && call?.status === 'ringing' && (
              <p className="text-blue-200 text-sm mt-1">
                {callType} call in progress...
              </p>
            )}
            {!isIncoming && call?.status === 'connected' && (
              <p className="text-green-200 text-sm mt-1">
                ✓ Call accepted - Connected
              </p>
            )}
            {!isIncoming && call?.status === 'rejected' && (
              <p className="text-red-200 text-sm mt-1">
                ✗ Call rejected
              </p>
            )}
          </div>

          {/* Call duration - only show when call is active */}
          {call?.status === 'connected' && (
            <div className="flex items-center justify-center mt-4">
              <span className="text-blue-200 text-sm">
                Duration: {formatDuration(callDuration)}
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-6">
          {isIncoming ? (
            // Incoming call content
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This call will include {callType} only
              </p>
              
              {/* Action buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onReject}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  title="Decline call"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={onAccept}
                  className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                  title="Accept call"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center justify-center mt-4 space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Audio Call</span>
              </div>
            </div>
          ) : call?.status === 'ringing' ? (
            // Outgoing call - ringing
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Waiting for {call?.to?.name || call?.from?.name || 'Unknown User'} to answer...
              </p>
              
              {/* Cancel button */}
              <div className="flex justify-center">
                <button
                  onClick={onEndCall}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  title="Cancel call"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : call?.status === 'rejected' ? (
            // Outgoing call - rejected
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {call?.to?.name || call?.from?.name || 'Unknown User'} declined your call
              </p>
              
              {/* Close button */}
              <div className="flex justify-center">
                <button
                  onClick={onEndCall}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  title="Close"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Active call content
            <div className="text-center">
              {callType === 'video' && remoteStream ? (
                <div className="relative mb-4">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {localStream && (
                    <div className="absolute bottom-2 right-2 w-16 h-12 bg-black rounded overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted={true}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white">
                    {isIncoming ? (call?.from?.name || 'U').charAt(0).toUpperCase() : (call?.to?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isIncoming ? (call?.from?.name || 'Unknown User') : (call?.to?.name || 'Unknown User')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {callType === 'video' ? 'Video Call' : 'Audio Call'}
              </p>
              
              {/* Call controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onToggleAudio}
                  className={`p-3 rounded-full transition-colors ${
                    isAudioEnabled 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isAudioEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    )}
                  </svg>
                </button>
                
                {callType === 'video' && (
                  <button
                    onClick={onToggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                
                {callType === 'video' && (
                  <button
                    onClick={onToggleScreenShare}
                    className={`p-3 rounded-full transition-colors ${
                      isScreenSharing 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={onEndCall}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="End call"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio elements (hidden) */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
};

export default MinimizableCallModal;
