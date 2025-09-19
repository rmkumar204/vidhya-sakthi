import React, { useEffect, useRef } from 'react';
import {
  PhoneIcon,
  XMarkIcon,
  VideoCameraIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

interface IncomingCallModalProps {
  isOpen: boolean;
  callType: 'video' | 'audio';
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callType,
  callerName,
  callerAvatar,
  onAccept,
  onReject
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play ringtone when modal opens
  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch((error) => {
        // Ignore AbortError as it's expected when component unmounts
        if (error.name !== 'AbortError') {
          console.error('Audio play error:', error);
        }
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
          <div className="relative">
            {/* Caller Avatar */}
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {callerAvatar ? (
                <img 
                  src={callerAvatar} 
                  alt={callerName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            
            {/* Call Type Icon */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              {callType === 'video' ? (
                <VideoCameraIcon className="w-5 h-5 text-blue-600" />
              ) : (
                <MicrophoneIcon className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>
          
          <h2 className="text-white text-xl font-semibold mb-1">{callerName}</h2>
          <p className="text-blue-100 text-sm">
            Incoming {callType === 'video' ? 'video' : 'audio'} call
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${dot * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {callType === 'video' 
                ? 'This call will include video and audio' 
                : 'This call will include audio only'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              title="Decline call"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              title="Accept call"
            >
              <PhoneIcon className="w-7 h-7" />
            </button>
          </div>

          {/* Call Type Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {callType === 'video' ? (
              <>
                <VideoCameraIcon className="w-4 h-4" />
                <span>Video Call</span>
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-4 h-4" />
                <span>Audio Call</span>
              </>
            )}
          </div>
        </div>

        {/* Ringtone (Hidden) */}
        <audio
          ref={audioRef}
          preload="auto"
          className="hidden"
        >
          <source src="/sounds/ringtone.mp3" type="audio/mpeg" />
          <source src="/sounds/ringtone.ogg" type="audio/ogg" />
        </audio>
      </div>
    </div>
  );
};

export default IncomingCallModal;
