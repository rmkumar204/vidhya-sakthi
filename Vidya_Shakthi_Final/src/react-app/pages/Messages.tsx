import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import TypingIndicator from '@/react-app/components/TypingIndicator';
import MessageInput from '@/react-app/components/MessageInput';
import Avatar from '@/react-app/components/Avatar';
import { RobustVideoCallModal } from '@/react-app/components/RobustVideoCallModal';
import { SimpleAudioCallModal } from '@/react-app/components/SimpleAudioCallModal';
import { MediaTest } from '@/react-app/components/MediaTest';
import { Call } from '@/react-app/types';
import { getUserProfile, getCurrentUserProfile, UserProfile } from '@/react-app/services/userProfileService';

// Enhanced utility function to render formatted text like Teams
const renderFormattedText = (text: string) => {
  // Handle HTML formatting tags directly
  
  // Handle bold <strong>text</strong>
  text = text.replace(/<strong>(.*?)<\/strong>/g, '<strong class="font-bold">$1</strong>');
  
  // Handle italic <em>text</em>
  text = text.replace(/<em>(.*?)<\/em>/g, '<em class="italic">$1</em>');
  
  // Handle underline <u>text</u>
  text = text.replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>');
  
  // Handle strikethrough <s>text</s>
  text = text.replace(/<s>(.*?)<\/s>/g, '<s class="line-through">$1</s>');
  
  // Handle code <code>text</code>
  text = text.replace(/<code>(.*?)<\/code>/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Handle code blocks <pre><code>text</code></pre>
  text = text.replace(/<pre><code>(.*?)<\/code><\/pre>/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>');
  
  // Handle blockquotes <blockquote>text</blockquote>
  text = text.replace(/<blockquote>(.*?)<\/blockquote>/g, '<blockquote class="border-l-4 border-blue-500 dark:border-blue-400 pl-3 italic text-gray-600 dark:text-gray-400 my-2">$1</blockquote>');
  
  // Handle highlight <mark>text</mark>
  text = text.replace(/<mark>(.*?)<\/mark>/g, '<mark class="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">$1</mark>');
  
  // Handle font color <span style="color: red;">text</span>
  text = text.replace(/<span style="color: red;">(.*?)<\/span>/g, '<span class="text-red-500">$1</span>');
  
  // Handle font size <span style="font-size: 18px;">text</span>
  text = text.replace(/<span style="font-size: 18px;">(.*?)<\/span>/g, '<span class="text-lg">$1</span>');
  
  // Handle links <a href="url">text</a>
  text = text.replace(/<a href="([^"]*)">(.*?)<\/a>/g, '<a href="$1" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">$2</a>');
  
  // Handle paragraphs <p>text</p>
  text = text.replace(/<p>(.*?)<\/p>/g, '<p class="my-2">$1</p>');
  
  // Handle bullet lists • text
  text = text.replace(/^• (.+)$/gm, '<div class="flex items-start my-1"><span class="text-gray-500 dark:text-gray-400 mr-2">•</span><span>$1</span></div>');
  
  // Handle numbered lists 1. text, 2. text, etc.
  text = text.replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start my-1"><span class="text-gray-500 dark:text-gray-400 mr-2 font-medium">$1.</span><span>$2</span></div>');
  
  // Handle line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
};

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string; // Emoji avatar (like 👩‍💻, 👨‍💻)
  content: string; // can be text or URL for media
  timestamp: Date;
  type: 'text' | 'audio' | 'file' | 'image';
  isMe: boolean;
  isScheduled?: boolean;
  scheduledFor?: Date;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
  userId: string; // Reference to user profile
}

const chats: Chat[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    avatar: '👩‍💻',
    userId: '1',
    lastMessage: 'Thank you for the feedback on my project!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: 2,
    online: true
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    avatar: '👨‍💻',
    userId: '2',
    lastMessage: 'Can we schedule a call tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: 1,
    online: true
  },
  {
    id: '3',
    name: 'Anita Patel',
    avatar: '👩‍🎓',
    userId: '3',
    lastMessage: 'I completed the assignment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 0,
    online: false
  },
  {
    id: '4',
    name: 'Vikash Singh',
    avatar: '👨‍🎓',
    userId: '4',
    lastMessage: 'Great! Looking forward to the next session',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    unread: 0,
    online: false
  }
];

const initialMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    senderName: 'Priya Sharma',
    senderAvatar: '👩‍💻',
    content: 'Hi! I have a question about the **CSS assignment**',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'text',
    isMe: false
  },
  {
    id: '2',
    senderId: 'me',
    senderName: 'You',
    senderAvatar: '👤',
    content: 'Sure! Here\'s a quick explanation:\n\n> **justify-content** controls horizontal alignment\n> **align-items** controls vertical alignment\n\nTry this code:\n`display: flex`\n\nHere are the main properties:\n• **justify-content**: horizontal alignment\n• **align-items**: vertical alignment\n• **flex-direction**: row or column\n• **flex-wrap**: wrap or nowrap\n\n1. First, set `display: flex`\n2. Then add `justify-content: center`\n3. Finally, add `align-items: center`',
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    type: 'text',
    isMe: true
  },
  {
    id: '3',
    senderId: '1',
    senderName: 'Priya Sharma',
    senderAvatar: '👩‍💻',
    content: 'I\'m struggling with *flexbox layouts*. Could you explain the difference between `justify-content` and `align-items`?',
    timestamp: new Date(Date.now() - 1000 * 60 * 13),
    type: 'text',
    isMe: false
  },
  {
    id: '4',
    senderId: 'me',
    senderName: 'You',
    senderAvatar: '👤',
    content: 'Great question! justify-content controls alignment along the main axis, while align-items controls alignment along the cross axis.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    type: 'text',
    isMe: true
  },
  {
    id: '5',
    senderId: '1',
    senderName: 'Priya Sharma',
    senderAvatar: '👩‍💻',
    content: 'Thank you for the feedback on my project!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'text',
    isMe: false
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<string>('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messagesState, setMessagesState] = useState<Message[]>(initialMessages);
  const [scheduledMessages, setScheduledMessages] = useState<Array<{id: string, message: string, files?: File[], scheduledFor: Date}>>([]);
  const [language] = useState<'en' | 'ta' | 'hi'>('en');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  
  // Call state
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [showMediaTest, setShowMediaTest] = useState(false);
  const [currentUser] = useState<UserProfile | null>(getCurrentUserProfile());


  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  // Helper function to get user avatar from profile
  const getUserAvatar = (userId: string): string => {
    const userProfile = getUserProfile(userId);
    return userProfile?.avatar || '👤';
  };

  // Cleanup screen sharing on unmount
  useEffect(() => {
    return () => {
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'> & Partial<Pick<Message,'timestamp'>>) => {
    const full: Message = {
      id: String(Date.now() + Math.random()),
      timestamp: msg.timestamp ?? new Date(),
      ...msg,
    } as Message;
    setMessagesState(prev => [...prev, full]);
  };

  const simulateBotReply = (prompt: string) => {
    setIsBotTyping(true);
    setTimeout(() => {
      addMessage({
        senderId: 'bot',
        senderName: 'Mentor Bot',
        senderAvatar: '🤖',
        content: `Here is a suggestion for "${prompt}"\n\n- Try breaking the problem down\n- Focus on one layout at a time\n- Use devtools to inspect flex axes`,
        type: 'text',
        isMe: false
      });
      setIsBotTyping(false);
    }, 2500);
  };

  const handleSendMessage = async (messageText: string, files?: File[]) => {
    const hasText = messageText.trim().length > 0;
    const hasFiles = files && files.length > 0;
    if (!hasText && !hasFiles) return;

    const sendNow = () => {
      // Send text
      if (hasText) {
        addMessage({ senderId: 'me', senderName: 'You', senderAvatar: currentUser?.avatar || '👤', content: messageText.trim(), type: 'text', isMe: true });
        simulateBotReply(messageText.trim());
      }
      // Send files
      if (hasFiles) {
        files.forEach(file => {
          const url = URL.createObjectURL(file);
          const isImage = file.type.startsWith('image/');
          const isAudio = file.type.startsWith('audio/');
          addMessage({
            senderId: 'me',
            senderName: 'You',
            senderAvatar: currentUser?.avatar || '👤',
            content: url,
            type: isImage ? 'image' : (isAudio ? 'audio' : 'file'),
            isMe: true
          });
        });
      }
    };

    sendNow();
  };

  const handleScheduleMessage = (messageText: string, files: File[] | undefined, scheduledFor: Date) => {
    const scheduledMessageId = Date.now().toString();
    const displayMessageId = `scheduled_${scheduledMessageId}`;
    
    const scheduledMessage = {
      id: scheduledMessageId,
      message: messageText,
      files: files,
      scheduledFor: scheduledFor
    };
    
    setScheduledMessages(prev => [...prev, scheduledMessage]);
    
    // Add scheduled message to the messages list for display
    addMessage({
      id: displayMessageId,
      senderId: 'me',
      senderName: 'You',
      senderAvatar: currentUser?.avatar || '👤',
      content: messageText,
      type: 'text',
      isMe: true,
      isScheduled: true,
      scheduledFor: scheduledFor
    });
    
    // Schedule the actual sending
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        // Remove the scheduled message and send the actual message
        setMessagesState(prev => prev.filter(msg => msg.id !== displayMessageId));
        handleSendMessage(messageText, files);
        // Remove from scheduled messages
        setScheduledMessages(prev => prev.filter(msg => msg.id !== scheduledMessageId));
      }, delay);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatScheduledTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
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

  const handleScreenShareClick = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach(track => track.stop());
        screenShareStreamRef.current = null;
      }
      setIsScreenSharing(false);
      
      // Add a system message about stopping screen sharing
      addMessage({
        content: '🛑 Stopped screen sharing',
        type: 'text',
        isMe: true,
        senderId: 'current-user',
        senderName: 'You',
        senderAvatar: currentUser?.avatar || '👤'
      });
    } else {
      // Start screen sharing directly
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported in this browser. Please use Chrome, Firefox, or Edge.');
          return;
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });

        screenShareStreamRef.current = stream;
        setIsScreenSharing(true);
        
        // Add a system message about starting screen sharing
        addMessage({
          content: '🖥️ Started screen sharing',
          type: 'text',
          isMe: true,
          senderId: 'current-user',
          senderName: 'You',
          senderAvatar: currentUser?.avatar || '👤'
        });

        // Handle when user stops sharing via browser UI
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            handleScreenShareClick(); // This will stop the sharing
          });
        }

      } catch (err: any) {
        console.error('Screen share error:', err);
        
        let errorMessage = 'Failed to start screen sharing.';
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission was denied. Please allow screen sharing and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No screen or window available for sharing. Please try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Screen sharing is not supported in this browser.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Screen sharing was cancelled.';
        }
        
        alert(errorMessage);
      }
    }
  };

  // Call handlers
  const handleStartAudioCall = () => {
    if (selectedChatData) {
      const call: Call = {
        id: `call_${Date.now()}`,
        type: 'audio',
        participants: [selectedChatData.id],
        status: 'initiating',
        startTime: new Date()
      };
      setActiveCall(call);
    }
  };

  const handleStartVideoCall = () => {
    if (selectedChatData) {
      const call: Call = {
        id: `call_${Date.now()}`,
        type: 'video',
        participants: [selectedChatData.id],
        status: 'initiating',
        startTime: new Date()
      };
      setActiveCall(call);
    }
  };

  const handleEndCall = () => {
    // End call and cleanup
    setActiveCall(null);
  };

  const handleCloseCallModal = () => {
    // Close modal and cleanup
    setActiveCall(null);
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
                <Avatar 
                  name={chat.name}
                  size="xl"
                  online={chat.online}
                  showStatus={true}
                  emoji={getUserAvatar(chat.userId)}
                />
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
                  <Avatar 
                    name={selectedChatData.name}
                    size="lg"
                    online={selectedChatData.online}
                    showStatus={true}
                    emoji={getUserAvatar(selectedChatData.userId)}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{selectedChatData.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isBotTyping ? 'Typing…' : (selectedChatData.online ? 'Online' : 'Offline')}
                      {scheduledMessages.length > 0 && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          • {scheduledMessages.length} scheduled
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleStartAudioCall}
                    disabled={!selectedChatData.online}
                    title={selectedChatData.online ? 'Start audio call' : 'User offline'}
                    className={`p-2 rounded-lg transition-colors ${selectedChatData.online ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleStartVideoCall}
                    disabled={!selectedChatData.online}
                    title={selectedChatData.online ? 'Start video call' : 'User offline'}
                    className={`p-2 rounded-lg transition-colors ${selectedChatData.online ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleScreenShareClick}
                    title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                    className={`p-2 rounded-lg transition-colors ${
                      isScreenSharing 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ComputerDesktopIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900">
              {messagesState.map((message) => (
                <div key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
                  {!message.isMe && (
                    <div className="flex-shrink-0">
                      <Avatar 
                        name={message.senderName || 'Unknown'} 
                        size="md" 
                        online={false}
                        showStatus={false}
                        emoji={getUserAvatar(message.senderId)}
                      />
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[280px] sm:max-w-xs lg:max-w-md ${message.isMe ? 'items-end' : 'items-start'}`}>
                    {!message.isMe && (
                      <div className="mb-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {message.senderName || 'Unknown'}
                        </p>
                      </div>
                    )}
                    
                    <div className={`px-3 sm:px-4 py-2 sm:py-3 ${
                      message.isScheduled
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl rounded-br-md shadow-lg'
                        : message.isMe 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-lg' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm'
                    }`}>
                      {message.type === 'text' && (
                        <div>
                          <p 
                            className={`text-sm leading-relaxed whitespace-pre-wrap ${
                              message.isScheduled ? 'text-gray-200 italic' : ''
                            }`}
                            dangerouslySetInnerHTML={{ __html: renderFormattedText(message.content) }}
                          />
                          {message.isScheduled && message.scheduledFor && (
                            <div className="flex items-center mt-2 text-xs text-gray-300">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span>Scheduled for {formatScheduledTime(message.scheduledFor)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.type === 'image' && (
                        <img src={message.content} alt="uploaded" className="rounded-lg max-h-60 object-contain" />
                      )}
                      {message.type === 'audio' && (
                        <audio controls src={message.content} className="w-56" />
                      )}
                      {message.type === 'file' && (
                        <a href={message.content} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Download file</a>
                      )}
                    </div>
                    
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
                  
                  {message.isMe && (
                    <div className="flex-shrink-0">
                      <Avatar 
                        name="You" 
                        size="md" 
                        online={true}
                        showStatus={false}
                        emoji={currentUser?.avatar || '👤'}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Bot Typing Indicator */}
              {isBotTyping && selectedChatData && (
                <TypingIndicator 
                  name={selectedChatData.name} 
                  userId={selectedChatData.userId}
                />
              )}

              {/* User Typing Indicator */}
              {isUserTyping && (
                <TypingIndicator 
                  name="You" 
                  isCurrentUser={true}
                />
              )}

            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onScheduleMessage={handleScheduleMessage}
              onTyping={setIsUserTyping}
              placeholder={
                language === 'en' ? 'Type a message...' :
                language === 'ta' ? 'செய்தியை தட்டச்சு செய்யவும்...' :
                'संदेश लिखें...'
              }
            />
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

      {/* Media Test Modal */}
      {showMediaTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Media Access Test</h2>
              <button
                onClick={() => setShowMediaTest(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MediaTest />
          </div>
        </div>
      )}


      {/* Call Modals */}
      {activeCall && activeCall.type === 'audio' && currentUser && (
        <SimpleAudioCallModal
          call={activeCall}
          user={currentUser}
          onEndCall={handleEndCall}
          onClose={handleCloseCallModal}
        />
      )}

      {activeCall && activeCall.type === 'video' && currentUser && (
        <RobustVideoCallModal
          call={activeCall}
          user={currentUser}
          onEndCall={handleEndCall}
          onClose={handleCloseCallModal}
        />
      )}

    </div>
  );
}
