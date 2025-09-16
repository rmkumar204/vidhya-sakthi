import Avatar from './Avatar';

interface TypingIndicatorProps {
  name: string;
  isCurrentUser?: boolean;
}

export default function TypingIndicator({ name, isCurrentUser = false }: TypingIndicatorProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-start space-x-3 mb-2`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0">
          <Avatar 
            name={name} 
            size="md" 
            online={false}
            showStatus={false}
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-fit">
        {/* Teams-style typing animation */}
        <div className="flex items-center space-x-1">
          <div className="flex space-x-0.5">
            <div 
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '0ms',
                animationDuration: '1.4s'
              }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '200ms',
                animationDuration: '1.4s'
              }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" 
              style={{ 
                animationDelay: '400ms',
                animationDuration: '1.4s'
              }}
            ></div>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {isCurrentUser ? 'You are typing' : `${name} is typing`}
        </span>
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0">
          <Avatar 
            name="You" 
            size="md" 
            online={true}
            showStatus={false}
          />
        </div>
      )}
    </div>
  );
}
