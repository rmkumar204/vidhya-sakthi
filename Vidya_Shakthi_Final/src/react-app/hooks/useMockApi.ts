import { useState, useEffect, useCallback } from 'react';
import { User, Chat, ConnectionRequest, Message } from '../types';
import { webSocketService } from '../services/WebSocketService';
import { localStorageService } from '../services/LocalStorageService';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'mentor',
    avatarUrl: '',
    isOnline: true
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'mentee',
    avatarUrl: '',
    isOnline: true
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'mentor',
    avatarUrl: '',
    isOnline: false
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'mentee',
    avatarUrl: '',
    isOnline: true
  }
];

export const useMockApi = (currentUserId: string | null) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [chats, setChats] = useState<Chat[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUserId) {
      webSocketService.connect(currentUserId);
      
      const handleConnectionStatus = (data: { status: string }) => {
        setIsConnected(data.status === 'connected');
      };

      webSocketService.on('connection_status', handleConnectionStatus);
      
      return () => {
        webSocketService.off('connection_status', handleConnectionStatus);
      };
    }
  }, [currentUserId]);

  // Load initial data
  useEffect(() => {
    if (currentUserId) {
      loadInitialData();
    }
  }, [currentUserId]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Load chats from localStorage
    const savedChats = localStorageService.get<Chat[]>('chats', []);
    setChats(savedChats);
    
    // Load connection requests from localStorage
    const savedRequests = localStorageService.get<ConnectionRequest[]>('connectionRequests', []);
    setConnectionRequests(savedRequests);
    
    setLoading(false);
  };

  const sendConnectionRequest = useCallback(async (toUserId: string) => {
    if (!currentUserId) return;

    const fromUser = users.find(u => u.id === currentUserId);
    const toUser = users.find(u => u.id === toUserId);
    
    if (!fromUser || !toUser) return;

    const newRequest: ConnectionRequest = {
      id: `req_${Date.now()}`,
      fromUserId: currentUserId,
      toUserId,
      fromUser,
      toUser,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setConnectionRequests(prev => [...prev, newRequest]);
    localStorageService.set('connectionRequests', [...connectionRequests, newRequest]);

    // Send via WebSocket
    webSocketService.send('connection_request', {
      connectionId: newRequest.id,
      fromUserId: currentUserId,
      toUserId,
      fromUserName: fromUser.name,
      toUserName: toUser.name,
      timestamp: newRequest.createdAt
    });
  }, [currentUserId, users, connectionRequests]);

  const handleConnectionRequest = useCallback(async (requestId: string, action: 'accept' | 'reject') => {
    const request = connectionRequests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'accept') {
      // Create a new chat
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        userIds: [request.fromUserId, request.toUserId],
        users: [request.fromUser, request.toUser],
        messages: [],
        unreadCount: 0
      };

      setChats(prev => [...prev, newChat]);
      localStorageService.set('chats', [...chats, newChat]);

      // Send accept via WebSocket
      webSocketService.send('connection_accept', {
        connectionId: requestId,
        timestamp: new Date().toISOString()
      });
    } else {
      // Send reject via WebSocket
      webSocketService.send('connection_reject', {
        connectionId: requestId
      });
    }

    // Remove the request
    setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    localStorageService.set('connectionRequests', connectionRequests.filter(r => r.id !== requestId));
  }, [connectionRequests, chats]);

  const sendMessage = useCallback(async (chatId: string, senderId: string, content: string, type: 'text' | 'voice' = 'text') => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      type,
      isRead: false,
      isDelivered: true
    };

    // Update chat with new message
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: newMessage,
          lastMessageAt: newMessage.timestamp
        };
      }
      return c;
    });

    setChats(updatedChats);
    localStorageService.set('chats', updatedChats);

    // Send via WebSocket
    const otherUserId = chat.userIds.find(id => id !== senderId);
    if (otherUserId) {
      webSocketService.send('message', {
        chatId,
        content,
        senderId,
        senderName: users.find(u => u.id === senderId)?.name || 'Unknown',
        timestamp: newMessage.timestamp,
        messageType: type
      });
    }

    // Dispatch custom event for chat refresh
    window.dispatchEvent(new CustomEvent('connectsphere-chat-refresh'));
  }, [chats, users]);

  // WebSocket event handlers
  useEffect(() => {
    const handleMessage = (payload: any) => {
      const { chatId, content, senderId, senderName, timestamp, messageType } = payload;
      
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        chatId,
        senderId,
        content,
        timestamp,
        type: messageType || 'text',
        isRead: false,
        isDelivered: true
      };

      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
              lastMessageAt: newMessage.timestamp
            };
          }
          return chat;
        });
        
        localStorageService.set('chats', updatedChats);
        return updatedChats;
      });

      // Dispatch custom event for chat refresh
      window.dispatchEvent(new CustomEvent('connectsphere-chat-refresh'));
    };

    const handleConnectionRequest = (payload: any) => {
      const { connectionId, fromUserId, toUserId, fromUserName, toUserName, timestamp } = payload;
      
      const fromUser = users.find(u => u.id === fromUserId) || {
        id: fromUserId,
        name: fromUserName,
        email: '',
        role: 'user',
        avatarUrl: '',
        isOnline: true
      };
      
      const toUser = users.find(u => u.id === toUserId) || {
        id: toUserId,
        name: toUserName,
        email: '',
        role: 'user',
        avatarUrl: '',
        isOnline: true
      };

      const newRequest: ConnectionRequest = {
        id: connectionId,
        fromUserId,
        toUserId,
        fromUser,
        toUser,
        status: 'pending',
        createdAt: timestamp
      };

      setConnectionRequests(prev => [...prev, newRequest]);
      localStorageService.set('connectionRequests', [...connectionRequests, newRequest]);
    };

    webSocketService.on('message', handleMessage);
    webSocketService.on('connection_request', handleConnectionRequest);

    return () => {
      webSocketService.off('message', handleMessage);
      webSocketService.off('connection_request', handleConnectionRequest);
    };
  }, [users, connectionRequests]);

  return {
    users,
    chats,
    connectionRequests,
    loading,
    isConnected,
    sendConnectionRequest,
    handleConnectionRequest,
    sendMessage
  };
};
