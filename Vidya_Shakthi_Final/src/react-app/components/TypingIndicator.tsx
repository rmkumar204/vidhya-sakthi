import Avatar from './Avatar';
import { getUserProfile, getCurrentUserProfile } from '@/react-app/services/userProfileService';

interface TypingIndicatorProps {
  name: string;
  userId?: string;
  isCurrentUser?: boolean;
}

export default function TypingIndicator({ name, userId, isCurrentUser = false }: TypingIndicatorProps) {
  // Get user avatar from profile
  const getUserAvatar = (userId?: string): string => {
    if (isCurrentUser) {
      const currentUser = getCurrentUserProfile();
      return currentUser?.avatar || '👤';
    }
    if (userId) {
      const userProfile = getUserProfile(userId);
      return userProfile?.avatar || '👤';
    }
    return '👤';
  };

  const userAvatar = getUserAvatar(userId);
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        <Avatar 
          name={name} 
          size="sm" 
          online={false}
          showStatus={false}
          emoji={userAvatar}
        />
      </div>
      
      <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        {/* Teams-style typing animation */}
        <div className="flex items-center space-x-1">
          <div className="flex space-x-0.5">
            <div 
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '0ms',
                animationDuration: '1.4s'
              }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '200ms',
                animationDuration: '1.4s'
              }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '400ms',
                animationDuration: '1.4s'
              }}
            ></div>
          </div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          {isCurrentUser ? 'You are typing' : `${name} is typing`}
        </span>
      </div>
    </div>
  );
}
