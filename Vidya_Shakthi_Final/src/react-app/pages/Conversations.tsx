import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { 
  getConversations, 
  Conversation
} from '../services/ConversationService';
import { RealTimeConversation } from '../components/RealTimeConversation';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

export default function Conversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCounts] = useState<Record<string, number>>({});

  // Load conversations on component mount
  useEffect(() => {
    if (user?.token) {
      loadConversations();
    }
  }, [user?.token]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await getConversations({ page: 1, limit: 50 }, user?.token || '');
      setConversations(response.conversations);
    } catch (error) {
      logger.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = conversation.participants.find(p => p._id !== user?.id);
    const searchLower = searchTerm.toLowerCase();
    const firstName = otherParticipant?.first_name || '';
    const lastName = otherParticipant?.last_name || '';
    return (
      firstName.toLowerCase().includes(searchLower) ||
      lastName.toLowerCase().includes(searchLower) ||
      conversation.project.title.toLowerCase().includes(searchLower) ||
      conversation.last_message?.toLowerCase().includes(searchLower)
    );
  });

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
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

  const getConversationTitle = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    if (otherParticipant) {
      const firstName = otherParticipant.first_name || '';
      const lastName = otherParticipant.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Unknown User';
    }
    return 'Unknown User';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    if (otherParticipant) {
      const role = otherParticipant.role || 'unknown';
      return `${role === 'mentor' ? 'Mentor' : 'Mentee'} • ${conversation.project.title}`;
    }
    return conversation.project.title;
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setSidebarOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      
      {/* Conversations List Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative z-40 w-full sm:w-80 lg:w-1/3 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-transform duration-300 ease-in-out`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Conversations
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {conversations.length} active
            </div>
          </div>
          
          {/* Search */}
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

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start a conversation by connecting with a mentor or mentee'
                }
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?._id === conversation._id;
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      name={getConversationTitle(conversation)}
                      size="xl"
                      online={true}
                      showStatus={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        {unreadCounts[conversation._id] > 0 && (
                          <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCounts[conversation._id]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getConversationSubtitle(conversation)}
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

      {/* Conversation View */}
      <div className="flex-1 flex flex-col lg:relative">
        {selectedConversation ? (
          <>
            {/* Mobile Header */}
            <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToConversations}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <Avatar 
                    name={getConversationTitle(selectedConversation)}
                    size="md"
                    online={true}
                    showStatus={true}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getConversationTitle(selectedConversation)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getConversationSubtitle(selectedConversation)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Conversation Component */}
            <div className="flex-1">
              <RealTimeConversation 
                conversation={selectedConversation}
                onClose={window.innerWidth < 1024 ? handleBackToConversations : undefined}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
