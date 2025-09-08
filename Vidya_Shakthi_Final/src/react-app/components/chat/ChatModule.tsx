import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Users, MessageCircle } from 'lucide-react';

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
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Failed to fetch chat rooms:', error);
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
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedRoom || (!newMessage.trim() && !selectedFile)) return;

    try {
      const formData = new FormData();
      formData.append('message_text', newMessage);
      formData.append('chat_room_id', selectedRoom.id.toString());
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchMessages(selectedRoom.id);
        fetchChatRooms(); // Update room list with latest message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        
        <div className="overflow-y-auto h-full">
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
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          <p className="text-sm">{message.message_text}</p>
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
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {selectedFile && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedFile}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.m4a"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && !selectedFile}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
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
