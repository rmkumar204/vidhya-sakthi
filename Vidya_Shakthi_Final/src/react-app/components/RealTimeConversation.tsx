import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  ComputerDesktopIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  PhoneIcon as PhoneIconSolid,
  ComputerDesktopIcon as ComputerDesktopIconSolid
} from '@heroicons/react/24/solid';
import Avatar from './Avatar';
import TypingIndicator from './TypingIndicator';
import { logger } from '../utils/logger';
import { useConversationWebRTC } from '../hooks/useConversationWebRTC';
import { 
  Conversation, 
  ConversationMessage, 
  RealTimeConversationService,
  sendMessage
} from '../services/ConversationService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface RealTimeConversationProps {
  conversation: Conversation;
  onClose?: () => void;
}

export const RealTimeConversation: React.FC<RealTimeConversationProps> = ({
  conversation,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>(conversation.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realTimeServiceRef = useRef<RealTimeConversationService | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the other participant (not the current user)
  const otherParticipant = conversation.participants.find(
    p => p._id !== user?.id
  );
  
  // Handle both populated and non-populated participant fields
  const otherParticipantName = otherParticipant 
    ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || 'Unknown User'
    : 'Unknown User';
  const otherParticipantRole = otherParticipant?.role || 'unknown';

  // Initialize WebRTC hook
  const {
    callState,
    incomingCall,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useConversationWebRTC(
    conversation._id,
    otherParticipant,
    user?.token || '',
    user?.id || ''
  );

  // Initialize real-time messaging
  useEffect(() => {
    if (user?.token && user?.id) {
      realTimeServiceRef.current = new RealTimeConversationService(user.token, user.id);
      
      realTimeServiceRef.current.connect(conversation._id).then(() => {
        logger.chat('Real-time conversation connected');
      }).catch(logger.error);

      // Set up event handlers
      realTimeServiceRef.current.on('message', handleNewMessage);
      realTimeServiceRef.current.on('typing', handleTyping);

      return () => {
        if (realTimeServiceRef.current) {
          realTimeServiceRef.current.disconnect();
        }
      };
    }
  }, [conversation._id, user?.token, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = useCallback((message: any) => {
    // Add new message to the list
    setMessages(prev => [...prev, message]);
  }, []);

  const handleTyping = useCallback((data: any) => {
    setOtherUserTyping(data.isTyping);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    logger.chat("---------- sub");
    

    setIsSending(true);
    try {
        logger.chat("---------- in");
        logger.chat(realTimeServiceRef.current);
        
      // Send via real-time service
      if (realTimeServiceRef.current) {
        logger.chat({newMessage});
        
        realTimeServiceRef.current.sendMessage(newMessage.trim());
      }

      // Also send via REST API for persistence
      await sendMessage(conversation._id, {
        content: newMessage.trim(),
        message_type: 'text'
      }, user?.token || '');

      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      logger.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (realTimeServiceRef.current) {
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        realTimeServiceRef.current.sendTyping(true);
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        realTimeServiceRef.current.sendTyping(false);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (realTimeServiceRef.current) {
          realTimeServiceRef.current.sendTyping(false);
        }
      }, 1000);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Helper function to safely extract sender information
  const getSenderInfo = (sender: string | { _id: string; first_name: string; last_name: string; email: string; role: string }) => {
    if (typeof sender === 'string') {
      // Try to find the participant in the conversation
      const participant = conversation.participants.find(p => p._id === sender);
      if (participant) {
        return {
          id: sender,
          name: `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || 'User',
          email: participant.email || '',
          role: participant.role || ''
        };
      }
      
      // If not found in participants, check if it's the current user
      if (sender === user?.id) {
        return {
          id: sender,
          name: user?.name || 'You',
          email: user?.email || '',
          role: user?.role || ''
        };
      }
      
      // Fallback for unknown sender
      return {
        id: sender,
        name: 'User',
        email: '',
        role: ''
      };
    }
    
    return {
      id: sender._id,
      name: `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'User',
      email: sender.email || '',
      role: sender.role || ''
    };
  };

  const formatMessageContent = (message: ConversationMessage) => {
    if (message.message_type === 'call_started') {
      return (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <PhoneIconSolid className="h-4 w-4" />
          <span className="text-sm font-medium">{message.content}</span>
        </div>
      );
    }
    
    if (message.message_type === 'call_ended') {
      return (
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <PhoneIcon className="h-4 w-4" />
          <span className="text-sm">{message.content}</span>
        </div>
      );
    }

    if (message.message_type === 'screen_share_started') {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <ComputerDesktopIconSolid className="h-4 w-4" />
          <span className="text-sm font-medium">{message.content}</span>
        </div>
      );
    }

    if (message.message_type === 'screen_share_ended') {
      return (
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <ComputerDesktopIcon className="h-4 w-4" />
          <span className="text-sm">{message.content}</span>
        </div>
      );
    }

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </p>
    );
  };

  const renderCallModal = () => {
    if (!callState.isInCall && !incomingCall) return null;

    if (incomingCall) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar 
                  name={`${otherParticipant?.first_name} ${otherParticipant?.last_name}`}
                  size="xl"
                  online={true}
                  showStatus={false}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {otherParticipant?.first_name} {otherParticipant?.last_name} is calling you
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={rejectCall}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={acceptCall}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <PhoneIconSolid className="h-5 w-5" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (callState.isInCall) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col">
            {/* Remote Video */}
            <div className="flex-1 flex items-center justify-center">
              {callState.callType === 'video' ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-white text-center">
                    <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Waiting for video...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white">
                  <div className="flex justify-center mb-8">
                    <Avatar 
                      name={`${otherParticipant?.first_name} ${otherParticipant?.last_name}`}
                      size="xl"
                      online={true}
                      showStatus={false}
                    />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {otherParticipant?.first_name} {otherParticipant?.last_name}
                  </h3>
                  <p className="text-gray-300">
                    {callState.callDuration > 0 && (
                      <span>{Math.floor(callState.callDuration / 60)}:{(callState.callDuration % 60).toString().padStart(2, '0')}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            {callState.callType === 'video' && callState.localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={(video) => {
                    if (video && callState.localStream) {
                      video.srcObject = callState.localStream;
                    }
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Call Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-4 bg-gray-800 rounded-full px-6 py-4">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-colors ${
                    callState.isAudioEnabled 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {callState.isAudioEnabled ? (
                    <MicrophoneIcon className="h-6 w-6" />
                  ) : (
                    <SpeakerXMarkIcon className="h-6 w-6" />
                  )}
                </button>

                {callState.callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isVideoEnabled 
                        ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                  {callState.isVideoEnabled ? (
                    <PlayIcon className="h-6 w-6" />
                  ) : (
                    <StopIcon className="h-6 w-6" />
                  )}
                  </button>
                )}

                {callState.callType === 'video' && (
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isScreenSharing 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <ComputerDesktopIcon className="h-6 w-6" />
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <PhoneIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar 
            name={otherParticipantName}
            size="lg"
            online={true}
            showStatus={true}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {otherParticipantName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {otherParticipantRole === 'mentor' ? 'Mentor' : 'Mentee'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={startAudioCall}
            disabled={callState.isInCall}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start audio call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button
            onClick={startVideoCall}
            disabled={callState.isInCall}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start video call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Use helper function to safely extract sender information
          const senderInfo = getSenderInfo(message.sender);
          const isCurrentUser = senderInfo.id === user?.id;
          
          return (
            <div
              key={message._id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}
            >
              {!isCurrentUser && (
                <div className="flex-shrink-0">
                  <Avatar 
                    name={senderInfo.name}
                    size="md"
                    online={false}
                    showStatus={false}
                  />
                </div>
              )}
              
              <div className={`flex flex-col max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {!isCurrentUser && (
                  <div className="mb-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {senderInfo.name}
                    </p>
                  </div>
                )}
                
                <div className={`px-4 py-2 rounded-2xl ${
                  isCurrentUser 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                }`}>
                {formatMessageContent(message)}
              </div>
              
                <div className="flex items-center justify-end mt-1 space-x-1">
                  <p className={`text-xs ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                  {isCurrentUser && (
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 text-blue-100">
                        <svg viewBox="0 0 16 15" fill="currentColor">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.064-.512z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {isCurrentUser && (
                <div className="flex-shrink-0">
                  <Avatar 
                    name={user?.name || 'You'}
                    size="md"
                    online={true}
                    showStatus={false}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {otherUserTyping && (
          <TypingIndicator 
            name={otherParticipantName}
            userId={otherParticipant?._id || ''}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTypingChange(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
          </div>
          
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Call Modal */}
      {renderCallModal()}
    </div>
  );
};
