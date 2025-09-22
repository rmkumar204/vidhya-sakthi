import { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Paperclip, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import MessageInput from '../MessageInput';
import TypingIndicator from '../TypingIndicator';
import { logger } from '../../utils/logger';

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message_text: string;
  file_url?: string;
  file_name?: string;
  sent_at: string;
  message_type: 'text' | 'file' | 'image' | 'audio';
}

interface ChatRoom {
  id: number;
  name: string;
  type: 'project_group' | 'mentor_mentee';
  project_id?: number;
  last_message?: string;
  unread_count: number;
}

interface ChatModuleProps {
  userId: number;
  userRole: string;
}

export default function ChatModule({ userId }: ChatModuleProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<Array<{
    id: string;
    message: string;
    files?: File[];
    scheduledFor: Date;
    timeoutId?: NodeJS.Timeout;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatRooms();
  }, [userId]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.rooms || []);
      }
    } catch (error) {
      logger.error('Failed to fetch chat rooms:', error);
      toast.error('Failed to load chat rooms');
    }
  };

  const fetchMessages = async (roomId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      logger.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText: string, files?: File[]) => {
    if (!selectedRoom || (!messageText.trim() && (!files || files.length === 0))) return;

    try {
      const formData = new FormData();
      formData.append('message_text', messageText);
      formData.append('chat_room_id', selectedRoom.id.toString());
      
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('file', file);
        });
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchMessages(selectedRoom.id);
        fetchChatRooms(); // Update room list with latest message
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleScheduleMessage = (messageText: string, files: File[] | undefined, scheduledFor: Date) => {
    // Schedule message for later sending
    const messageId = Date.now().toString();
    
    // Schedule the actual sending
    const delay = scheduledFor.getTime() - Date.now();
    let timeoutId: NodeJS.Timeout | undefined;
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        sendMessage(messageText, files);
        // Remove from scheduled messages
        setScheduledMessages(prev => prev.filter(msg => msg.id !== messageId));
      }, delay);
    }
    
    const scheduledMessage = {
      id: messageId,
      message: messageText,
      files: files,
      scheduledFor: scheduledFor,
      timeoutId: timeoutId
    };
    
    setScheduledMessages(prev => {
      const newMessages = [...prev, scheduledMessage];
      toast.success(`Message scheduled for ${scheduledFor.toLocaleString()}`);
      return newMessages;
    });
  };

  const handleCancelScheduledMessage = (messageId: string) => {
    setScheduledMessages(prev => {
      const message = prev.find(msg => msg.id === messageId);
      if (message && message.timeoutId) {
        clearTimeout(message.timeoutId);
      }
      return prev.filter(msg => msg.id !== messageId);
    });
  };


  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <div className="h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-lg flex">
      {/* Chat Rooms List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </h3>
        </div>
        
        <div className="overflow-y-auto h-full" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No chat rooms available
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {room.type === 'project_group' ? (
                      <Users className="w-6 h-6 text-blue-500" />
                    ) : (
                      <MessageCircle className="w-6 h-6 text-green-500" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {room.name}
                      </h4>
                      {room.last_message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {room.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                  {room.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedRoom.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedRoom.type === 'project_group' ? 'Project Group Chat' : 'Direct Message'}
                {scheduledMessages.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • {scheduledMessages.length} scheduled
                  </span>
                )}
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.sender_name}
                          </p>
                        )}
                        
                        {message.message_type === 'text' ? (
                          <p 
                            className="text-sm" 
                            dangerouslySetInnerHTML={{ __html: message.message_text }}
                          />
                        ) : (
                          <div className="space-y-2">
                            {message.message_text && (
                              <p className="text-sm">{message.message_text}</p>
                            )}
                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs">{message.file_name}</span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(message.sent_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Scheduled Messages */}
              {scheduledMessages.length > 0 && (
                <div className="space-y-2">
                  {scheduledMessages.map((scheduledMsg) => (
                    <div key={scheduledMsg.id} className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                              Scheduled for {scheduledMsg.scheduledFor.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCancelScheduledMessage(scheduledMsg.id)}
                            className="p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Cancel scheduled message"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          {scheduledMsg.message}
                        </p>
                        {scheduledMsg.files && scheduledMsg.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {scheduledMsg.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded">
                                <Paperclip className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                          <button
                            onClick={() => handleCancelScheduledMessage(scheduledMsg.id)}
                            className="w-full px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors font-medium"
                          >
                            Cancel Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Teams-style Typing Indicator */}
              {isUserTyping && (
                <TypingIndicator name="You" isCurrentUser={true} />
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Test Button for Scheduled Messages */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  const testMessage = {
                    id: Date.now().toString(),
                    message: "Test scheduled message",
                    files: undefined,
                    scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
                    timeoutId: undefined
                  };
                  setScheduledMessages(prev => [...prev, testMessage]);
                }}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Add Test Scheduled Message
              </button>
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={sendMessage}
              onScheduleMessage={handleScheduleMessage}
              onTyping={setIsUserTyping}
              placeholder="Type your message..."
              disabled={isLoading}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a chat room to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
