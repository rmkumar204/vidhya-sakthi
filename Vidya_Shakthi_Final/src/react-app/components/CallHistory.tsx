import React, { useState, useEffect } from 'react';
import { getUserData, getUserAvatar } from '../services/UserService';

export interface CallHistoryEntry {
  id: string;
  type: 'video' | 'audio';
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'declined' | 'failed';
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CallHistoryProps {
  callHistory: CallHistoryEntry[];
  currentUserId: string;
  onCallUser?: (userId: string, callType: 'audio' | 'video') => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  callHistory,
  currentUserId,
  onCallUser
}) => {
  const [userCache, setUserCache] = useState<Map<string, { name: string; avatar: string }>>(new Map());

  // Format duration in MM:SS format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format time in HH:MM format
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get user info with caching
  const getUserInfo = async (userId: string) => {
    if (userCache.has(userId)) {
      return userCache.get(userId)!;
    }

    const token = localStorage.getItem('access_token');
    const userData = await getUserData(userId, token || undefined);
    const userInfo = {
      name: userData?.name || 'Unknown User',
      avatar: getUserAvatar(userId)
    };

    setUserCache(prev => new Map(prev).set(userId, userInfo));
    return userInfo;
  };

  // Get the other participant in the call
  const getOtherParticipant = (entry: CallHistoryEntry) => {
    return entry.fromUserId === currentUserId ? entry.toUserId : entry.fromUserId;
  };

  // Get call direction and status
  const getCallInfo = (entry: CallHistoryEntry) => {
    const isOutgoing = entry.fromUserId === currentUserId;
    const otherUserId = getOtherParticipant(entry);
    
    return {
      isOutgoing,
      otherUserId,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      status: entry.status
    };
  };

  // Get status icon and color
  const getStatusIcon = (entry: CallHistoryEntry) => {
    const { isOutgoing, status } = getCallInfo(entry);
    
    if (status === 'completed') {
      return {
        icon: '✓',
        color: 'text-green-500',
        bgColor: 'bg-green-500'
      };
    } else if (status === 'missed') {
      return {
        icon: '✗',
        color: 'text-red-500',
        bgColor: 'bg-red-500'
      };
    } else if (status === 'declined') {
      return {
        icon: '↩',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500'
      };
    } else {
      return {
        icon: '⚠',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500'
      };
    }
  };

  // Load user info for all entries
  useEffect(() => {
    const loadUserInfo = async () => {
      const uniqueUserIds = new Set<string>();
      callHistory.forEach(entry => {
        uniqueUserIds.add(entry.fromUserId);
        uniqueUserIds.add(entry.toUserId);
      });

      for (const userId of uniqueUserIds) {
        if (!userCache.has(userId)) {
          await getUserInfo(userId);
        }
      }
    };

    loadUserInfo();
  }, [callHistory, userCache]);

  if (callHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <p className="text-lg font-medium">No call history</p>
        <p className="text-sm">Your call history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {callHistory.map((entry) => {
        const { isOutgoing, otherUserId } = getCallInfo(entry);
        const userInfo = userCache.get(otherUserId) || { name: 'Unknown User', avatar: '👤' };
        const statusInfo = getStatusIcon(entry);
        const callTypeIcon = entry.type === 'video' ? '📹' : '📞';

        return (
          <div
            key={entry.id}
            className="bg-slate-800 rounded-lg p-4 flex items-center space-x-4 hover:bg-slate-700 transition-colors cursor-pointer"
            onClick={() => onCallUser?.(otherUserId, entry.type)}
          >
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {userInfo.avatar.length === 1 && userInfo.avatar !== '👤' ? userInfo.avatar : userInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Call Details */}
            <div className="flex-1 min-w-0">
              {/* User Name */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-white font-medium truncate">{userInfo.name}</h3>
                <span className="text-gray-400 text-sm">{callTypeIcon}</span>
              </div>

              {/* Call Status and Duration */}
              <div className="flex items-center space-x-2 mb-1">
                {/* Status Icon */}
                <div className={`w-4 h-4 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{statusInfo.icon}</span>
                </div>
                
                {/* Call Type Icon */}
                <span className="text-gray-300 text-sm">
                  {entry.type === 'video' ? '📹' : '📞'}
                </span>
                
                {/* Call Description */}
                <span className="text-white text-sm">
                  {entry.type} call with {userInfo.name} - {formatDuration(entry.duration)}
                </span>
              </div>

              {/* Actual Duration */}
              <div className="text-gray-400 text-xs">
                Duration: {formatDuration(entry.duration)}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right">
              <div className="text-gray-400 text-sm">
                {formatTime(entry.endTime)}
              </div>
              {entry.connectionQuality && (
                <div className={`text-xs mt-1 ${
                  entry.connectionQuality === 'excellent' ? 'text-green-400' :
                  entry.connectionQuality === 'good' ? 'text-yellow-400' :
                  entry.connectionQuality === 'fair' ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {entry.connectionQuality}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CallHistory;
