import React, { useState, useCallback } from 'react';
import { User } from '../types';
import { PhoneIcon, VideoCameraIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../hooks/useAppContext';
import { logger } from '../utils/logger';

interface ChatHeaderProps {
  user: User;
  isInCall?: boolean;
  isVideoCall?: boolean;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  user, 
  isInCall = false, 
  isVideoCall = false, 
  isScreenSharing = false,
  onToggleScreenShare 
}) => {
  const { initiateCall } = useAppContext();
  const [isSharing, setIsSharing] = useState(false);

  const handleScreenShare = useCallback(async () => {
    if (isInCall && isVideoCall) {
      // If in a video call, toggle screen sharing
      if (onToggleScreenShare) {
        onToggleScreenShare();
      }
    } else {
      // If not in a call, start a video call with screen sharing
      try {
        await initiateCall(user, 'video');
        // Note: Screen sharing will be available once the call is established
      } catch (error) {
        logger.error('Failed to start video call for screen sharing:', error);
      }
    }
  }, [isInCall, isVideoCall, onToggleScreenShare, initiateCall, user]);

  const handleAudioCall = useCallback(() => {

    logger.chat("---------------- initiateCall",user);
    
    initiateCall(user, 'audio');
  }, [initiateCall, user]);

  const handleVideoCall = useCallback(() => {
    initiateCall(user, 'video');
  }, [initiateCall, user]);

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center mr-4">
          <span className="text-white font-semibold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{user.name}</h2>
          <p className="text-sm text-slate-400">{user.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={handleAudioCall}
          disabled={isInCall}
          className={`p-2 rounded-full transition-colors ${
            isInCall 
              ? 'text-slate-500 cursor-not-allowed' 
              : 'text-slate-400 hover:bg-slate-700 hover:text-sky-400'
          }`}
          title={isInCall ? 'End current call first' : 'Start audio call'}
        >
          <PhoneIcon className="h-5 w-5" />
        </button>
        
        <button 
          onClick={handleVideoCall}
          disabled={isInCall}
          className={`p-2 rounded-full transition-colors ${
            isInCall 
              ? 'text-slate-500 cursor-not-allowed' 
              : 'text-slate-400 hover:bg-slate-700 hover:text-sky-400'
          }`}
          title={isInCall ? 'End current call first' : 'Start video call'}
        >
          <VideoCameraIcon className="h-5 w-5" />
        </button>
        
        <button 
          onClick={handleScreenShare}
          className={`p-2 rounded-full transition-colors ${
            isScreenSharing 
              ? 'text-blue-400 bg-blue-900/20' 
              : isInCall && isVideoCall
                ? 'text-slate-400 hover:bg-slate-700 hover:text-blue-400'
                : 'text-slate-400 hover:bg-slate-700 hover:text-blue-400'
          }`}
          title={
            isScreenSharing 
              ? 'Stop screen sharing' 
              : isInCall && isVideoCall 
                ? 'Start screen sharing' 
                : 'Start video call with screen sharing'
          }
        >
          <ComputerDesktopIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
