import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '../types';
import ChatHeader from './ChatHeader';
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (chatId: string, content: string, type?: 'text' | 'voice') => void;
  isInCall?: boolean;
  isVideoCall?: boolean;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  onSendMessage,
  isInCall = false,
  isVideoCall = false,
  isScreenSharing = false,
  onToggleScreenShare
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = chat.users.find(user => user.id !== chat.userIds[0]) || chat.users[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(chat.id, message.trim());
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Typing indicator
    if (!isTyping) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <ChatHeader 
        user={otherUser}
        isInCall={isInCall}
        isVideoCall={isVideoCall}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={onToggleScreenShare}
      />
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.map((msg) => {
          const isCurrentUser = msg.senderId === chat.userIds[0];
          const sender = chat.users.find(u => u.id === msg.senderId);
          
          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isCurrentUser 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {!isCurrentUser && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {sender?.name || 'Unknown User'}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  isCurrentUser ? 'text-sky-100' : 'text-slate-400'
                }`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded-lg">
              <p className="text-sm">{otherUser.name} is typing...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-end space-x-2">
          <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
            <PaperClipIcon className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-sky-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-slate-600 disabled:text-slate-400 transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
