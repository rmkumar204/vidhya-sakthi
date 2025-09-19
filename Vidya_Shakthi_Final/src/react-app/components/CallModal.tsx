import React, { useEffect, useRef } from 'react';
import { Call } from '../types';
import { PhoneIcon, XIcon } from './Icons';

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

interface CallModalProps {
  call: Call;
  onAccept: () => void;
  onReject: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ call, onAccept, onReject }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Create a simple ringtone using Web Audio API
    const playRingtone = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
    };

    playRingtone();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg shadow-xl p-8 flex flex-col items-center gap-6 border border-slate-600 animate-pulse">
        <div className={`w-24 h-24 rounded-full border-4 border-slate-500 flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(call.from.name)}`}>
          {getUserInitials(call.from.name)}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{call.from.name || 'Unknown User'}</h2>
          <p className="text-slate-400">is calling you...</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onReject} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full transition-colors">
            <XIcon /> Decline
          </button>
          <button onClick={onAccept} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-full transition-colors">
            <PhoneIcon /> Accept
          </button>
        </div>
      </div>
      <audio ref={audioRef} loop>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdCCiN0/PSgjUG" type="audio/wav" />
      </audio>
    </div>
  );
};

export default CallModal;