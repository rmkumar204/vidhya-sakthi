import React, { useEffect, useRef } from 'react';
import { Call } from '../types';
import { PhoneIcon, XIcon } from './Icons';
import { logger } from '../utils/logger';

// Utility function to get user initials
const getUserInitials = (name: string | undefined): string => {
  if (!name || typeof name !== 'string') {
    return 'U'; // Default to 'U' for User
  }
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Utility function to get avatar background color based on name
const getAvatarColor = (name: string | undefined): string => {
  if (!name || typeof name !== 'string') {
    return 'bg-purple-500'; // Default color
  }
  const colors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface OutgoingCallModalProps {
  call: Call;
  onCancel: () => void;
}

const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({ call, onCancel }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Play outgoing call ringtone
    const playOutgoingTone = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(logger.error);
      }
    };

    playOutgoingTone();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg shadow-xl p-8 flex flex-col items-center gap-6 border border-slate-600">
        <div className={`w-32 h-32 rounded-full border-4 border-slate-500 flex items-center justify-center text-white text-3xl font-bold animate-pulse ${getAvatarColor(call.to.name)}`}>
          {getUserInitials(call.to.name)}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{call.to.name || 'Unknown User'}</h2>
          <p className="text-slate-400">Calling...</p>
          <div className="flex items-center justify-center mt-3 gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce delay-0"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>
        
        {/* Call Type Indicator */}
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">
            {call.type === 'audio' ? '🎤 Audio Call' : '📹 Video Call'}
          </p>
        </div>

        {/* Cancel Button - Make it more prominent */}
        <div className="flex gap-4">
          <button 
            onClick={onCancel} 
            className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 shadow-lg shadow-red-600/30 min-w-[140px]"
            title="Cancel Call"
          >
            <XIcon /> Cancel
          </button>
        </div>
      </div>
      
      {/* Outgoing call ringtone - different from incoming */}
      <audio ref={audioRef} loop>
        <source src="data:audio/wav;base64,UklGRqYCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYICAAAwMTEyMzM0NDU1NjY3Nzg4OTk6Ojs7PDw9PT4+Pz9AQEFBQkJDQ0REPDw9PT4+Pz9AQEFBQkJDQ0REPDw9PT4+Pz9AQEFBQkJDQ0REAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" type="audio/wav" />
      </audio>
    </div>
  );
};

export default OutgoingCallModal;