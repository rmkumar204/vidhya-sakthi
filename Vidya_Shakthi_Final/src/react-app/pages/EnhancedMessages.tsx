import { useState, useRef, useEffect } from 'react';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ComputerDesktopIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import TypingIndicator from '@/react-app/components/TypingIndicator';
import MessageInput from '@/react-app/components/MessageInput';
import Avatar from '@/react-app/components/Avatar';
import { useAuth } from '@/react-app/hooks/useAuth';
// import VideoCallView from '@/react-app/components/VideoCallView'; // Now handled globally by AppWithCalls
// import AudioCallView from '@/react-app/components/AudioCallView'; // Now handled globally by AppWithCalls
// import IncomingCallModal from '@/react-app/components/IncomingCallModal'; // Now handled globally by AppWithCalls
import { messagingService, Message, Chat, Connection } from '@/react-app/services/MessagingService';
import { webSocketService } from '@/react-app/services/WebSocketService';
import { getConversations, getConversation, sendMessage as sendConversationMessage, Conversation, ConversationMessage } from '@/react-app/services/ConversationService';
import toast from 'react-hot-toast';

// Enhanced utility function to render formatted text
const renderFormattedText = (text: string) => {
  // Handle HTML formatting tags
  text = text.replace(/<strong>(.*?)<\/strong>/g, '<strong class="font-bold">$1</strong>');
  text = text.replace(/<em>(.*?)<\/em>/g, '<em class="italic">$1</em>');
  text = text.replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>');
  text = text.replace(/<s>(.*?)<\/s>/g, '<s class="line-through">$1</s>');
  text = text.replace(/<code>(.*?)<\/code>/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  text = text.replace(/<pre><code>(.*?)<\/code><\/pre>/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>');
  text = text.replace(/<blockquote>(.*?)<\/blockquote>/g, '<blockquote class="border-l-4 border-blue-500 dark:border-blue-400 pl-3 italic text-gray-600 dark:text-gray-400 my-2">$1</blockquote>');
  text = text.replace(/<mark>(.*?)<\/mark>/g, '<mark class="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">$1</mark>');
  text = text.replace(/<span style="color: red;">(.*?)<\/span>/g, '<span class="text-red-500">$1</span>');
  text = text.replace(/<span style="font-size: 18px;">(.*?)<\/span>/g, '<span class="text-lg">$1</span>');
  text = text.replace(/<a href="([^"]*)">(.*?)<\/a>/g, '<a href="$1" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">$2</a>');
  text = text.replace(/<p>(.*?)<\/p>/g, '<p class="my-2">$1</p>');
  text = text.replace(/^• (.+)$/gm, '<div class="flex items-start my-1"><span class="text-gray-500 dark:text-gray-400 mr-2">•</span><span>$1</span></div>');
  text = text.replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start my-1"><span class="text-gray-500 dark:text-gray-400 mr-2 font-medium">$1.</span><span>$2</span></div>');
  text = text.replace(/\n/g, '<br>');
  return text;
};

interface EnhancedMessagesProps {
  onInitiateCall?: (toUserId: string, callType: 'audio' | 'video') => void;
}

export default function EnhancedMessages({ onInitiateCall }: EnhancedMessagesProps) {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const selectedChatRef = useRef<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectionRequests, setShowConnectionRequests] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [, setForceUpdate] = useState(0);

  // Call functionality is now handled globally by AppWithCalls
  // All call-related hooks and state management have been moved to the global level

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize services
  useEffect(() => {
    if (user?.id) {
      initializeServices();
      setupEventHandlers();
    }

    // Cleanup function - remove all listeners
    return () => {
      // Note: WebSocket service should handle cleanup when disconnecting
      console.log('🧹 Cleaning up EnhancedMessages component');
    };
  }, [user?.id]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const initializeServices = async () => {
    try {
      setIsLoading(true);
      
      // Connect to WebSocket
      await webSocketService.connect(user?.id || '');
      
      // Check and set initial connection status
      const currentStatus = webSocketService.isConnected() ? 'connected' : 'disconnected';
      console.log('🔌 Initial WebSocket connection status:', currentStatus);
      setConnectionStatus(currentStatus);
      
      // Load initial data
      loadChats();
      loadConversations();
      
    } catch (error) {
      console.error('Error initializing services:', error);
      toast.error('Failed to connect to messaging service');
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventHandlers = () => {
    // Message events - disabled to prevent duplicates with WebSocket handler
    // messagingService.on('message_received', handleMessageReceived);
    // messagingService.on('message_sent', handleMessageSent);
    messagingService.on('typing_status', handleTypingIndicator);
    
    // Chat events
    messagingService.on('chat_created', handleChatCreated);
    messagingService.on('unread_count_cleared', handleUnreadCountCleared);
    
    // Connection events
    messagingService.on('connection_request_received', handleConnectionRequestReceived);
    messagingService.on('connection_accepted', handleConnectionAccepted);
    messagingService.on('connection_rejected', handleConnectionRejected);
    
    // Connection status
    messagingService.on('connection_status', handleConnectionStatus);

    // WebSocket connection status
    const connectionStatusHandler = (status: any) => {
      console.log('🔌 WebSocket connection status:', status);
      setConnectionStatus(status.status);
    };

    const connectedHandler = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
    };

    const disconnectedHandler = () => {
      console.log('❌ WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    const connectionEstablishedHandler = (payload: any) => {
      console.log('🔌 Server connection established:', payload);
      setConnectionStatus('connected');
    };

    const messageHandler = (payload: any) => {
      console.log("------===------------------------------------------------------msg");
      
      console.log('📨 Received WebSocket message:', payload);
      
      // Skip if this is our own message (to prevent duplicates from sender)
      if (payload.senderId === user?.id) {
        console.log('Skipping own message to prevent duplicate');
        return;
      }
      
      // Create new message object
      const newMessage: Message = {
        id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatId: payload.chatId,
        senderId: payload.senderId,
        senderName: payload.senderName || 'Unknown User',
        content: payload.content,
        timestamp: payload.timestamp || new Date().toISOString(),
        messageType: payload.type || 'text',
        fileUrl: payload.fileUrl,
        callMetadata: payload.callMetadata,
        isRead: false,
        isDelivered: true
      };
      
      console.log('🔍 WebSocket message details:', {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        chatId: newMessage.chatId,
        timestamp: newMessage.timestamp
      });
      
      // Always add to messages if it's for the current chat
      if (payload.chatId === selectedChatRef.current) {
        console.log('✅ Chat ID matches, adding message to current chat');
        setMessages(prev => {
          console.log('📝 Current messages before update:', prev.length);
          
          // Check if message already exists by ID or content+timestamp (more robust)
          const exists = prev.some(msg => 
            msg.id === newMessage.id || 
            (msg.content === newMessage.content && 
             msg.senderId === newMessage.senderId && 
             Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
          );
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', newMessage.id);
            return prev;
          }
          
          console.log('➕ Adding new message to current chat:', newMessage);
          const updatedMessages = [...prev, newMessage];
          console.log('📊 Updated messages array:', updatedMessages.length, 'messages');
          
          // Note: Message persistence is handled by the messaging service when messages are sent
          // We don't need to store incoming WebSocket messages separately
          
          // Force UI update
          setForceUpdate(prev => prev + 1);
          return updatedMessages;
        });
        scrollToBottom();
      } else {
        console.log('❌ Chat ID does not match, not adding to current chat');
        console.log('🔍 Debug info:', {
          payloadChatId: payload.chatId,
          selectedChat: selectedChat,
          selectedChatType: typeof selectedChat,
          payloadChatIdType: typeof payload.chatId
        });
        
        // If still no match, try to add the message anyway for debugging
        console.log('🚨 FALLBACK: Adding message despite chat ID mismatch');
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('⚠️ Message already exists in fallback, skipping');
            return prev;
          }
          console.log('➕ FALLBACK: Adding message to current chat');
          return [...prev, newMessage];
        });
        scrollToBottom();
      }
      
      // FALLBACK: If chat ID doesn't match but we have a selected chat, 
      // check if this message should be displayed in the current chat
      if (payload.chatId !== selectedChat && selectedChat) {
        console.log('🔄 FALLBACK: Chat ID mismatch, checking if message should be displayed');
        
        // Check if the message is from a participant in the current chat
        const currentChat = chats.find(chat => chat.id === selectedChat);
        if (currentChat && currentChat.participants.includes(payload.senderId)) {
          console.log('✅ FALLBACK: Message is from current chat participant, adding to display');
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ Message already exists in fallback add, skipping');
              return prev;
            }
            console.log('➕ FALLBACK: Adding message to current chat');
            
            // Note: Message persistence is handled by the messaging service when messages are sent
            
            return [...prev, newMessage];
          });
          scrollToBottom();
        } else {
          console.log('❌ FALLBACK: Message is not from current chat participant');
          
          // Additional fallback: Check if this is a conversation message
          const currentConversation = conversations.find(conv => conv._id === selectedChat);
          if (currentConversation && currentConversation.participants.some(p => 
            (typeof p === 'string' ? p : p._id) === payload.senderId
          )) {
            console.log('✅ CONVERSATION FALLBACK: Message is from conversation participant, adding to display');
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists in conversation fallback, skipping');
                return prev;
              }
              console.log('➕ CONVERSATION FALLBACK: Adding message to current conversation');
              
              // Note: Message persistence is handled by the messaging service when messages are sent
              
              return [...prev, newMessage];
            });
            scrollToBottom();
          } else {
            console.log('❌ CONVERSATION FALLBACK: Message is not from conversation participant');
          }
        }
      }
      
      // Always update chat list to show new messages
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === payload.chatId) {
            return {
              ...chat,
              lastMessage: newMessage.content,
              lastMessageAt: newMessage.timestamp,
              unreadCount: chat.id === selectedChat ? chat.unreadCount : (chat.unreadCount || 0) + 1
            };
          }
          return chat;
        });
        
        // If chat doesn't exist, we might need to create it
        const chatExists = updatedChats.some(chat => chat.id === payload.chatId);
        if (!chatExists) {
          console.log('Chat not found, creating new chat entry');
          // This might need to be handled differently depending on your chat creation logic
        }
        
        return updatedChats;
      });
    };

    const typingHandler = (payload: any) => {
      console.log('⌨️ Received typing indicator:', payload);
      console.log(payload.chatId, selectedChatRef.current, payload.userId ,user?.id);
      
      // Check if this is actually a message disguised as a typing indicator
      if (payload.content && !payload.isTyping) {
        console.log('🚨 FOUND MESSAGE DISGUISED AS TYPING INDICATOR:', payload);
        // Treat this as a message
        const newMessage: Message = {
          id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatId: payload.chatId,
          senderId: payload.senderId || payload.userId,
          senderName: payload.senderName || 'Unknown User',
          content: payload.content,
          timestamp: payload.timestamp || new Date().toISOString(),
          messageType: payload.type || 'text',
          fileUrl: payload.fileUrl,
          callMetadata: payload.callMetadata,
          isRead: false,
          isDelivered: true
        };
        
        // Add to messages if it's for the current chat
        if (payload.chatId === selectedChatRef.current) {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
        }
        return;
      }
      
      // If no chat is selected, try to auto-select the chat
      if (!selectedChatRef.current && payload.chatId) {
        console.log('🚨 No chat selected for typing indicator, auto-selecting:', payload.chatId);
        selectedChatRef.current = payload.chatId;
        setSelectedChat(payload.chatId);
      }
      
      if (payload.chatId === selectedChatRef.current && payload.userId !== user?.id) {
        console.log('Setting typing indicator:', payload.isTyping);
        setIsUserTyping(payload.isTyping);
        // Force UI update
        setForceUpdate(prev => prev + 1);
        
        // Auto-hide typing indicator after 3 seconds
        if (payload.isTyping) {
          setTimeout(() => {
            setIsUserTyping(false);
            setForceUpdate(prev => prev + 1);
          }, 3000);
        }
      } else {
        // Fallback: show typing indicator even if chat ID doesn't match
        console.log('🚨 FALLBACK: Showing typing indicator despite chat ID mismatch');
        setIsUserTyping(payload.isTyping);
        setForceUpdate(prev => prev + 1);
        
        if (payload.isTyping) {
          setTimeout(() => {
            setIsUserTyping(false);
            setForceUpdate(prev => prev + 1);
          }, 3000);
        }
      }
    };

    // Handle incoming call notifications
    webSocketService.on('call_initiate', (payload: any) => {
      console.log('📞 Received call initiation:', payload);
      if (payload.toUserId === user?.id) {
        // Show incoming call notification
        toast.success(`Incoming ${payload.callType} call from ${payload.fromUserName}`);
        // You can also set state to show an incoming call modal here
      }
    });

    // Handle call acceptance
    webSocketService.on('call_accept', (payload: any) => {
      console.log('✅ Call accepted:', payload);
      toast.success('Call accepted');
    });

    // Handle call rejection
    webSocketService.on('call_reject', (payload: any) => {
      console.log('❌ Call rejected:', payload);
      toast.error('Call rejected');
    });

    // Handle call end
    webSocketService.on('call_end', (payload: any) => {
      console.log('📞 Call ended:', payload);
      toast.success('Call ended');
    });

    // Handle call history messages
    webSocketService.on('call_history', (payload: any) => {
      console.log('📞 Call history received:', payload);
      
      // Create a detailed call history message
      const callType = payload.callType === 'video' ? 'Video' : 'Audio';
      const duration = payload.duration || 0;
      const status = payload.status || 'completed';
      const content = `${callType} call ${status}`;
      
      const callHistoryMessage: Message = {
        id: `call-history-${payload.callId}`, // Use callId for consistent ID
        chatId: selectedChat || payload.fromUserId || 'default',
        senderId: 'system',
        senderName: 'System',
        content: content,
        timestamp: payload.timestamp || new Date().toISOString(),
        messageType: 'call_history',
        callMetadata: {
          callId: payload.callId,
          callType: payload.callType || 'audio',
          duration: duration,
          participants: payload.participants || []
        },
        isRead: false,
        isDelivered: true
      };

      console.log('📞 Adding call history message:', callHistoryMessage);
      console.log('📞 Current selected chat:', selectedChat);
      console.log('📞 Message chatId:', callHistoryMessage.chatId);

      // Add to messages in the current chat
      setMessages(prev => {
        console.log('📞 Current messages count:', prev.length);
        // Enhanced duplicate checking - check by ID, callId, and content
        const exists = prev.some(msg => 
          msg.id === callHistoryMessage.id || 
          (msg.messageType === 'call_history' && 
           msg.content === callHistoryMessage.content &&
           Math.abs(new Date(msg.timestamp).getTime() - new Date(callHistoryMessage.timestamp).getTime()) < 5000) // within 5 seconds
        );
        if (exists) {
          console.log('Call history message already exists, skipping');
          return prev;
        }
        
        console.log('📞 Adding call history message to state. New count:', prev.length + 1);
        const newMessages = [...prev, callHistoryMessage];
        console.log('📞 New messages:', newMessages);
        return newMessages;
      });
    });

    // Register WebSocket handlers
    webSocketService.on('connection_status', connectionStatusHandler);
    webSocketService.on('connected', connectedHandler);
    webSocketService.on('disconnected', disconnectedHandler);
    webSocketService.on('connection_established', connectionEstablishedHandler);
    webSocketService.on('message', messageHandler);
    webSocketService.on('typing', typingHandler);
  };

  const loadChats = () => {

    const loadedChats = messagingService.getChats();
    setChats(loadedChats);
  };

  const refreshConversations = async () => {
    await loadConversations();
    toast.success('Conversations refreshed');
  };

  const loadConversations = async () => {
    if (!user?.token) return;
    
    try {
      const response = await getConversations({ page: 1, limit: 50 }, user.token);
      setConversations(response.conversations);
      console.log('Loaded conversations:', response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    }
  };


  const loadMessages = (chatId: string) => {
    const loadedMessages = messagingService.getMessages(chatId);
    setMessages(loadedMessages);
    messagingService.clearUnreadCount(chatId);
    
    // Auto-scroll to bottom after loading messages
    setTimeout(() => {
      scrollToBottom();
    }, 200);
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (!user?.token) return;
    
    try {
      console.log('Loading conversation messages for:', conversationId);
      const response = await getConversation(conversationId, { page: 1, limit: 100 }, user.token);
      console.log('API Response:', response);
      
      // Check if response has the expected structure
      if (!response || !response.conversation || !response.conversation.messages) {
        console.error('Invalid response structure:', response);
        console.error('Response keys:', response ? Object.keys(response) : 'null');
        if (response?.conversation) {
          console.error('Conversation keys:', Object.keys(response.conversation));
        }
        toast.error('Invalid conversation data received');
        return;
      }
      
      // Convert ConversationMessage to Message format
      const messagesArray = response.conversation.messages || [];
      console.log('Messages array:', messagesArray);
      
      const convertedMessages: Message[] = messagesArray.map((msg: ConversationMessage) => ({
        id: msg._id,
        chatId: conversationId,
        senderId: typeof msg.sender === 'string' ? msg.sender : msg.sender._id,
        senderName: typeof msg.sender === 'string' ? 'Unknown User' : 
                   `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim() || 'Unknown User',
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.message_type as any,
        fileUrl: msg.file_url,
        callMetadata: msg.call_metadata,
        isRead: true,
        isDelivered: true
      }));
      
      setMessages(convertedMessages);
      console.log('Loaded conversation messages:', convertedMessages);
      
      // Auto-scroll to bottom after loading messages
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (error: any) {
      console.error('Error loading conversation messages:', error);
      
      // Handle different types of errors
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        toast.error('Conversation not found');
      } else if (error.message?.includes('403') || error.message?.includes('Access denied')) {
        toast.error('Access denied to this conversation');
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        toast.error('Authentication required');
      } else {
        toast.error('Failed to load messages');
      }
      
      // Set empty messages array on error
      setMessages([]);
    }
  };

  // Event handlers
  // Removed handleMessageReceived and handleMessageSent to prevent duplicates
  // Messages are now handled exclusively through WebSocket events

  const handleTypingIndicator = (data: any) => {
    if (data.chatId === selectedChat && data.userId !== user?.id) {
      setIsUserTyping(data.isTyping);
    }
  };

  const handleChatCreated = (chat: Chat) => {
    setChats(prev => [chat, ...prev]);
  };

  const handleUnreadCountCleared = () => {
    loadChats();
  };

  const handleConnectionRequestReceived = (connection: Connection) => {
    setPendingConnections(prev => [connection, ...prev]);
    toast.success(`New connection request from ${connection.mentorName}`);
  };

  const handleConnectionAccepted = () => {
    loadChats();
    loadConversations();
    toast.success('Connection accepted! Chat created.');
  };

  const handleConnectionRejected = () => {
    loadChats();
    toast('Connection was rejected');
  };

  const handleConnectionStatus = (data: { status: string }) => {
    setConnectionStatus(data.status);
  };

  // Message handling
  const handleSendMessage = async (messageText: string, files?: File[]) => {
    if (!selectedChat || !user?.id) return;

    const hasText = messageText.trim().length > 0;
    const hasFiles = files && files.length > 0;
    
    if (!hasText && !hasFiles) return;

    try {
      // Check if it's a conversation from backend
      const isConversation = conversations.some(conv => conv._id === selectedChat);
      
      if (isConversation && user?.token && hasText) {
        // Send to backend API for conversations
        const response = await sendConversationMessage(
          selectedChat,
          {
            content: messageText.trim(),
            message_type: 'text'
          },
          user.token
        );
        
        // Add the message from backend response to avoid duplicates
        const newMessage: Message = {
          id: response.message._id,
          chatId: selectedChat,
          senderId: typeof response.message.sender === 'string' ? response.message.sender : response.message.sender._id,
          senderName: user.name || 'You',
          content: response.message.content,
          timestamp: response.message.timestamp,
          messageType: response.message.message_type as any,
          isRead: true,
          isDelivered: true
        };
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('Conversation message already exists, skipping:', newMessage.id);
            return prev;
          }
          console.log('Adding conversation message:', newMessage);
          return [...prev, newMessage];
        });
        scrollToBottom();
        
      } else {
        // Send to local storage and WebSocket for local chats
        if (hasText) {
          await messagingService.sendMessage(
            selectedChat,
            messageText.trim(),
            user.id,
            user.name || 'You',
            'text'
          );
        }
      }

      // Send via WebSocket for real-time delivery (for both local chats and conversations)
      if (hasText) {
        console.log('📡 Sending WebSocket message for real-time delivery:', {
          chatId: selectedChat,
          content: messageText.trim(),
          type: 'text',
          isConversation
        });
        webSocketService.sendChatMessage(
          selectedChat,
          messageText.trim(),
          'text'
        );
      }

      // Send file messages
      if (hasFiles) {
        for (const file of files) {
          const fileUrl = URL.createObjectURL(file);
          const messageType = file.type.startsWith('image/') ? 'image' : 
                            file.type.startsWith('audio/') ? 'audio' : 'file';
          
          await messagingService.sendMessage(
            selectedChat,
            file.name,
            user.id,
            user.name || 'You',
            messageType,
            fileUrl
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (selectedChat) {
      // Send via both messaging service and direct WebSocket
      messagingService.sendTypingIndicator(selectedChat, isTyping);
      webSocketService.sendTypingIndicator(selectedChat, isTyping);
    }
  };

  // Call handling - now handled by onInitiateCall prop

  // const handleStartScreenShare = async () => {
  //   try {
  //     if (signalingCallState.isScreenSharing) {
  //       await stopSignalingScreenShare();
  //     } else {
  //       await startSignalingScreenShare();
  //     }
  //   } catch (error) {
  //     console.error('Failed to toggle screen share:', error);
  //     toast.error('Failed to toggle screen share');
  //   }
  // };

  // Call handlers are now managed globally by AppWithCalls
  // const handleAcceptCall = async () => {
  //   try {
  //     await acceptSignalingCall();
  //   } catch (error) {
  //     console.error('Failed to accept call:', error);
  //     toast.error('Failed to accept call');
  //   }
  // };

  // const handleRejectCall = () => {
  //   rejectSignalingCall();
  // };

  // const handleEndCall = () => {
  //   endSignalingCall();
  // };

  // const handleToggleAudio = () => {
  //   toggleSignalingAudio();
  // };

  // const handleToggleVideo = () => {
  //   toggleSignalingVideo();
  // };


  // Utility functions
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: Log when messages state changes
  useEffect(() => {
    console.log('📝 Messages state updated:', messages.length, 'messages');
  }, [messages]);

  // Debug: Log when selectedChat changes
  useEffect(() => {
    console.log('💬 Selected chat changed:', selectedChat);
  }, [selectedChat]);

  // Periodically check WebSocket connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const currentStatus = webSocketService.isConnected() ? 'connected' : 'disconnected';
      if (currentStatus !== connectionStatus) {
        console.log('🔄 Connection status changed:', connectionStatus, '->', currentStatus);
        setConnectionStatus(currentStatus);
        
        // Show toast notification for connection status changes
        if (currentStatus === 'connected') {
          toast.success('Connected to messaging service');
        } else if (currentStatus === 'disconnected') {
          toast.error('Disconnected from messaging service');
        } else if (currentStatus === 'connecting') {
          toast.loading('Connecting to messaging service...');
        }
      }
    };

    // Check immediately
    checkConnectionStatus();

    // Check every 5 seconds
    const interval = setInterval(checkConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

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

  console.log({chats, conversations});

  // Combine conversations from backend with local chats
  const combinedChats = [
    // Convert conversations to chat format
    ...conversations.map(conv => ({
      id: conv._id,
      name: conv.participants.find(p => p._id !== user?.id)?.first_name + ' ' + 
            conv.participants.find(p => p._id !== user?.id)?.last_name || 'Unknown User',
      avatar: '👤',
      participants: conv.participants.map(p => p._id),
      lastMessage: conv.last_message,
      lastMessageAt: conv.last_message_at,
      unreadCount: 0, // You can implement unread count logic
      isOnline: true,
      createdAt: conv.created_at,
      updatedAt: conv.created_at,
      connectionId: conv.connection_request
    })),
    // Add local chats
    ...chats
  ];

  const filteredChats = combinedChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = combinedChats.find(chat => chat.id === selectedChat);

  // Render message content
  const renderMessageContent = (message: Message) => {
    if (message.messageType === 'call_started') {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <PhoneIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{message.content}</span>
        </div>
      );
    }

    if (message.messageType === 'call_ended') {
      return (
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <PhoneIcon className="h-4 w-4" />
          <span className="text-sm">{message.content}</span>
        </div>
      );
    }

    if (message.messageType === 'call_history') {
      // Parse call metadata if available
      const callMetadata = message.callMetadata;
      const callType = callMetadata?.callType || 'audio';
      const duration = callMetadata?.duration || 0;
      const status = 'completed'; // Default status since it's not in the metadata structure
      
      return (
        <div className="flex items-center justify-center w-full">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-xs">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="flex items-center space-x-1">
                {callType === 'video' ? (
                  <VideoCameraIcon className="h-4 w-4" />
                ) : (
                  <PhoneIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {callType === 'video' ? 'Video' : 'Audio'} call
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-blue-500 dark:text-blue-400">
              <span className="capitalize">{status}</span>
              {duration > 0 && (
                <span className="font-mono">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (message.messageType === 'screen_share_started') {
      return (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <ComputerDesktopIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{message.content}</span>
        </div>
      );
    }

    if (message.messageType === 'screen_share_ended') {
      return (
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <ComputerDesktopIcon className="h-4 w-4" />
          <span className="text-sm">{message.content}</span>
        </div>
      );
    }

    if (message.messageType === 'image') {
      return (
        <img src={message.fileUrl} alt="uploaded" className="rounded-lg max-h-60 object-contain" />
      );
    }

    if (message.messageType === 'audio') {
      return (
        <audio controls src={message.fileUrl} className="w-56" />
      );
    }

    if (message.messageType === 'file') {
      return (
        <a href={message.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
          📎 {message.content}
        </a>
      );
    }

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        <span dangerouslySetInnerHTML={{ __html: renderFormattedText(message.content) }} />
      </p>
    );
  };

  // Render call modal
  const renderCallModal = () => {
    // Note: All call modals (incoming, active, outgoing) are now handled globally by AppWithCalls.tsx
    // This function is kept for compatibility but returns null
    return null;
  };


  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to messaging service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      
      {/* Chat List Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative z-40 w-full sm:w-80 lg:w-1/3 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshConversations}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh conversations"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const currentStatus = webSocketService.isConnected() ? 'connected' : 'disconnected';
                  console.log('🔍 Manual connection status check:', currentStatus);
                  setConnectionStatus(currentStatus);
                  toast.success(`Connection status: ${currentStatus}`);
                }}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Check connection status"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </button>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'disconnected' ? 'Disconnected' : 
                 connectionStatus}
              </span>
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

        {/* Connection Requests */}
        {pendingConnections.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowConnectionRequests(!showConnectionRequests)}
              className="w-full text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Connection Requests ({pendingConnections.length})
            </button>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
                onClick={() => {
                 console.log("selected chat is ----",chat.id);
                 
                  selectedChatRef.current = chat.id;
                  setSelectedChat(chat.id);
                
                // Check if it's a conversation from backend or local chat
                const isConversation = conversations.some(conv => conv._id === chat.id);
                console.log('Selected chat:', chat.id, 'Is conversation:', isConversation);
                
                if (isConversation) {
                  // Verify the conversation exists in our list
                  const conversation = conversations.find(conv => conv._id === chat.id);
                  if (conversation) {
                    loadConversationMessages(chat.id);
                  } else {
                    console.error('Conversation not found in local list:', chat.id);
                    toast.error('Conversation not found');
                    setMessages([]);
                  }
                } else {
                  loadMessages(chat.id);
                }
                
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
                  online={chat.isOnline}
                  showStatus={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chat.lastMessageAt ? formatLastMessageTime(new Date(chat.lastMessageAt)) : 'now'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unreadCount}
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
                    online={selectedChatData.isOnline}
                    showStatus={true}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{selectedChatData.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isUserTyping ? 'Typing…' : (selectedChatData.isOnline ? 'Online' : 'Offline')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const otherUserId = selectedChatData.participants?.find(id => id !== user?.id) || (selectedChatData as any).userId;
                      if (otherUserId && onInitiateCall) {
                        onInitiateCall(otherUserId, 'audio');
                      }
                    }}
                    disabled={!selectedChatData.isOnline || !onInitiateCall}
                    title={selectedChatData.isOnline ? 'Start audio call' : 'User offline'}
                    className={`p-2 rounded-lg transition-colors ${selectedChatData.isOnline && onInitiateCall ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      const otherUserId = selectedChatData.participants?.find(id => id !== user?.id) || (selectedChatData as any).userId;
                      if (otherUserId && onInitiateCall) {
                        onInitiateCall(otherUserId, 'video');
                      }
                    }}
                    disabled={!selectedChatData.isOnline || !onInitiateCall}
                    title={selectedChatData.isOnline ? 'Start video call' : 'User offline'}
                    className={`p-2 rounded-lg transition-colors ${selectedChatData.isOnline && onInitiateCall ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      // Screen sharing functionality will be handled by the global call system
                      toast('Screen sharing will be available during video calls');
                    }}
                    disabled={true}
                    title="Screen sharing available during video calls"
                    className="p-2 rounded-lg transition-colors text-gray-400 cursor-not-allowed"
                  >
                    <ComputerDesktopIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.id;
                
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
                    {!isCurrentUser && (
                      <div className="flex-shrink-0">
                        <Avatar 
                          name={message.senderName}
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
                            {message.senderName}
                          </p>
                        </div>
                      )}
                      
                      <div className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white rounded-br-md' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                      }`}>
                        {renderMessageContent(message)}
                      </div>
                      
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <p className={`text-xs ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(new Date(message.timestamp))}
                        </p>
                        {isCurrentUser && message.isDelivered && (
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
                          name="You"
                          size="md"
                          online={true}
                          showStatus={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator - positioned above input */}
            {isUserTyping && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <TypingIndicator 
                  name="Other user"
                  isCurrentUser={false}
                />
              </div>
            )}

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onScheduleMessage={() => {}} // Not implemented yet
              onTyping={handleTypingChange}
              placeholder="Type a message..."
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

      {/* Call Modals */}
      {renderCallModal()}
    </div>
  );
}