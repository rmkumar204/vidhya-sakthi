import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  showStatus?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md', 
  online = false, 
  showStatus = true,
  className = '' 
}) => {
  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate background color based on name
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600', 
      'from-green-500 to-green-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-orange-500 to-orange-600',
      'from-cyan-500 to-cyan-600'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg'
  };

  const statusSizeClasses = {
    sm: 'h-2 w-2 -bottom-0.5 -right-0.5',
    md: 'h-3 w-3 -bottom-0.5 -right-0.5',
    lg: 'h-3 w-3 -bottom-1 -right-1',
    xl: 'h-4 w-4 -bottom-1 -right-1'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br ${getBackgroundColor(name)} rounded-full flex items-center justify-center text-white font-medium shadow-sm`}>
        {getInitials(name)}
      </div>
      {showStatus && online && (
        <div className={`absolute ${statusSizeClasses[size]} bg-green-500 rounded-full border-2 border-white dark:border-gray-800`}></div>
      )}
    </div>
  );
};

export default Avatar;
