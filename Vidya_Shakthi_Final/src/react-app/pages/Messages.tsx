import { useState } from 'react';
import { 
  PaperAirplaneIcon, 
  FaceSmileIcon, 
  PaperClipIcon, 
  PhoneIcon, 
  VideoCameraIcon, 
  MagnifyingGlassIcon,
  MicrophoneIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import TypingIndicator from '@/react-app/components/TypingIndicator';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'audio' | 'file' | 'image';
  isMe: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
}

const chats: Chat[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    avatar: '👩‍💻',
    lastMessage: 'Thank you for the feedback on my project!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: 2,
    online: true
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    avatar: '👨‍💻',
    lastMessage: 'Can we schedule a call tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: 1,
    online: true
  },
  {
    id: '3',
    name: 'Anita Patel',
    avatar: '👩‍🎓',
    lastMessage: 'I completed the assignment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 0,
    online: false
  },
  {
    id: '4',
    name: 'Vikash Singh',
    avatar: '👨‍🎓',
    lastMessage: 'Great! Looking forward to the next session',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    unread: 0,
    online: false
  }
];

const messages: Message[] = [
  {
    id: '1',
    senderId: '1',
    senderName: 'Priya Sharma',
    content: 'Hi! I have a question about the CSS assignment',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'text',
    isMe: false
  },
  {
    id: '2',
    senderId: 'me',
    senderName: 'You',
    content: 'Sure! What specific part are you having trouble with?',
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    type: 'text',
    isMe: true
  },
  {
    id: '3',
    senderId: '1',
    senderName: 'Priya Sharma',
    content: 'I\'m struggling with flexbox layouts. Could you explain the difference between justify-content and align-items?',
    timestamp: new Date(Date.now() - 1000 * 60 * 13),
    type: 'text',
    isMe: false
  },
  {
    id: '4',
    senderId: 'me',
    senderName: 'You',
    content: 'Great question! justify-content controls alignment along the main axis, while align-items controls alignment along the cross axis.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    type: 'text',
    isMe: true
  },
  {
    id: '5',
    senderId: '1',
    senderName: 'Priya Sharma',
    content: 'Thank you for the feedback on my project!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'text',
    isMe: false
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      

      {/* Chat List Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative z-40 w-full sm:w-80 lg:w-1/3 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setSelectedChat(chat.id);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedChat === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatLastMessageTime(chat.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Window */}
      <div className="flex-1 flex flex-col lg:relative">
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile/tablet */}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                      {selectedChatData.avatar}
                    </div>
                    {selectedChatData.online && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{selectedChatData.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChatData.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 ${
                    message.isMe 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-lg' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <p className={`text-xs ${
                        message.isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      {message.isMe && (
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
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && selectedChatData && (
                <TypingIndicator name={selectedChatData.name} />
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-end space-x-2">
                <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <div className="min-h-[40px] max-h-32 overflow-y-auto">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        // Simulate typing indicator
                        if (e.target.value.length > 0) {
                          setIsTyping(true);
                          setTimeout(() => setIsTyping(false), 2000);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                  <div className="absolute right-3 bottom-2 flex items-center space-x-1">
                    <button className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                      <FaceSmileIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                      <MicrophoneIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
