import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { 
  getConversations, 
  getConversation, 
  sendMessage, 
  Conversation, 
  ConversationMessage 
} from '@/react-app/services/ConversationService';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

export default function MessagesNew() {
  const { user } = useAuth();
  const token = user?.token;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && token) {
      fetchConversationMessages(selectedConversationId);
    }
  }, [selectedConversationId, token]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getConversations({}, token);
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    if (!token) return;

    try {
      const response = await getConversation(conversationId, {}, token);
      setSelectedConversation(response.conversation);
      setMessages(response.conversation.messages || []);
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId || !token || sending) return;

    setSending(true);
    try {
      const response = await sendMessage(
        selectedConversationId,
        { content: messageText.trim() },
        token
      );

      // Add the new message to the messages list
      setMessages(prev => [...prev, response.message]);
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedConversationId 
            ? { 
                ...conv, 
                last_message: response.conversation.last_message,
                last_message_at: response.conversation.last_message_at 
              }
            : conv
        )
      );

      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
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

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?.id);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      
      {/* Conversations Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative z-40 w-full sm:w-80 lg:w-1/3 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.987l-2.42.908.908-2.42A7.955 7.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Start by connecting with mentors or mentees
                </p>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation._id}
                  onClick={() => {
                    setSelectedConversationId(conversation._id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversationId === conversation._id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {otherParticipant ? `${otherParticipant.first_name[0]}${otherParticipant.last_name[0]}` : '?'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Unknown'}
                        </h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLastMessageTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                          {otherParticipant?.role}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
                        Project: {conversation.project.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Avatar and info */}
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {(() => {
                      const other = getOtherParticipant(selectedConversation);
                      return other ? `${other.first_name[0]}${other.last_name[0]}` : '?';
                    })()}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {(() => {
                        const other = getOtherParticipant(selectedConversation);
                        return other ? `${other.first_name} ${other.last_name}` : 'Unknown';
                      })()}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.project.title}
                    </p>
                  </div>
                </div>
                
                {/* Call buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    title="Start audio call"
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    title="Start video call"
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Start the conversation by sending a message!
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.sender._id === user?.id;
                  return (
                    <div key={message._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-3`}>
                      {!isMe && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {message.sender?.first_name?.[0] || '?'}{message.sender?.last_name?.[0] || ''}
                        </div>
                      )}
                      
                      <div className={`flex flex-col max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {message.sender?.first_name || 'Unknown'} {message.sender?.last_name || ''}
                          </p>
                        )}
                        
                        <div className={`px-4 py-2 rounded-2xl ${
                          isMe 
                            ? 'bg-blue-500 text-white rounded-br-md' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.edited && (
                            <p className="text-xs mt-1 opacity-75">(edited)</p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                      
                      {isMe && (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {user?.name ? user.name[0] : 'Y'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.987l-2.42.908.908-2.42A7.955 7.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}