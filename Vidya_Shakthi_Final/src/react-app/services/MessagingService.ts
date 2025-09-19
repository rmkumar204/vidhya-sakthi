// Comprehensive Messaging Service with Local Storage and WebSocket
import { webSocketService } from './WebSocketService';
import { localStorageService, StoredMessage, StoredChat, StoredConnection } from './LocalStorageService';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'call_started' | 'call_ended' | 'call_history' | 'screen_share_started' | 'screen_share_ended';
  fileUrl?: string;
  callMetadata?: {
    callId: string;
    callType: 'audio' | 'video';
    duration?: number;
    participants: string[];
  };
  isRead?: boolean;
  isDelivered?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  connectionId?: string; // Link to mentor-mentee connection
}

export interface Connection {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  status: 'pending' | 'accepted' | 'rejected';
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

class MessagingService {
  private eventHandlers: Map<string, Function[]> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private messageQueue: Message[] = [];
  private isOnline = true;

  constructor() {
    this.setupWebSocketHandlers();
    this.setupOnlineStatusHandlers();
  }

  private setupWebSocketHandlers(): void {
    // Handle incoming messages
    webSocketService.on('message', (data: any) => {
      this.handleIncomingMessage(data);
    });

    // Handle typing indicators
    webSocketService.on('typing', (data: any) => {
      this.handleTypingIndicator(data);
    });

    // Handle message read receipts
    webSocketService.on('message_read', (data: any) => {
      this.handleMessageRead(data);
    });

    // Handle connection requests
    webSocketService.on('connection_request', (data: any) => {
      this.handleConnectionRequest(data);
    });

    // Handle connection responses
    webSocketService.on('connection_accept', (data: any) => {
      this.handleConnectionAccept(data);
    });

    webSocketService.on('connection_reject', (data: any) => {
      this.handleConnectionReject(data);
    });

    // Handle WebSocket connection status
    webSocketService.on('connected', () => {
      this.isOnline = true;
      this.processMessageQueue();
      this.emit('connection_status', { status: 'connected' });
    });

    webSocketService.on('disconnected', () => {
      this.isOnline = false;
      this.emit('connection_status', { status: 'disconnected' });
    });
  }

  private setupOnlineStatusHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processMessageQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Message management
  async sendMessage(
    chatId: string, 
    content: string, 
    senderId: string, 
    senderName: string,
    messageType: 'text' | 'image' | 'file' | 'audio' = 'text',
    fileUrl?: string,
    callMetadata?: any
  ): Promise<Message> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      messageType,
      fileUrl,
      callMetadata,
      isRead: false,
      isDelivered: false
    };

    // Save to local storage immediately
    const storedMessage: StoredMessage = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      callMetadata: message.callMetadata
    };

    localStorageService.saveMessage(storedMessage);

    // Update chat last message
    localStorageService.updateChatLastMessage(chatId, content, message.timestamp);

    // Send via WebSocket if online
    if (this.isOnline && webSocketService.isConnected()) {
      webSocketService.sendMessage(chatId, content, messageType, fileUrl, callMetadata);
      message.isDelivered = true;
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
    }

    // Emit message sent event
    this.emit('message_sent', message);

    return message;
  }

  getMessages(chatId: string): Message[] {
    const storedMessages = localStorageService.getMessages(chatId);
    return storedMessages.map(stored => ({
      id: stored.id,
      chatId: stored.chatId,
      senderId: stored.senderId,
      senderName: stored.senderName,
      content: stored.content,
      timestamp: stored.timestamp,
      messageType: stored.messageType,
      fileUrl: stored.fileUrl,
      callMetadata: stored.callMetadata,
      isRead: true, // Assume read for local messages
      isDelivered: true
    }));
  }

  markMessageAsRead(chatId: string, messageId: string): void {
    if (this.isOnline && webSocketService.isConnected()) {
      webSocketService.markMessageAsRead(chatId, messageId);
    }
  }

  sendTypingIndicator(chatId: string, isTyping: boolean): void {
    if (this.isOnline && webSocketService.isConnected()) {
      webSocketService.sendTyping(chatId, isTyping);
    }

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(chatId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set timeout to stop typing indicator
    if (isTyping) {
      const timeout = setTimeout(() => {
        if (this.isOnline && webSocketService.isConnected()) {
          webSocketService.sendTyping(chatId, false);
        }
        this.typingTimeouts.delete(chatId);
      }, 3000);

      this.typingTimeouts.set(chatId, timeout);
    } else {
      this.typingTimeouts.delete(chatId);
    }
  }

  // Chat management
  createChat(participants: string[], chatName: string, avatar: string = '👤', connectionId?: string): Chat {
    const chat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: chatName,
      avatar,
      participants,
      unreadCount: 0,
      isOnline: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectionId
    };

    const storedChat: StoredChat = {
      id: chat.id,
      name: chat.name,
      avatar: chat.avatar,
      participants: chat.participants,
      unreadCount: chat.unreadCount,
      isOnline: chat.isOnline,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };

    localStorageService.saveChat(storedChat);
    this.emit('chat_created', chat);

    return chat;
  }

  getChats(): Chat[] {
    const storedChats = localStorageService.getChats();
    return storedChats.map(stored => ({
      id: stored.id,
      name: stored.name,
      avatar: stored.avatar,
      participants: stored.participants,
      lastMessage: stored.lastMessage,
      lastMessageAt: stored.lastMessageAt,
      unreadCount: stored.unreadCount,
      isOnline: stored.isOnline,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt
    }));
  }

  getChat(chatId: string): Chat | null {
    const storedChat = localStorageService.getChat(chatId);
    if (!storedChat) return null;

    return {
      id: storedChat.id,
      name: storedChat.name,
      avatar: storedChat.avatar,
      participants: storedChat.participants,
      lastMessage: storedChat.lastMessage,
      lastMessageAt: storedChat.lastMessageAt,
      unreadCount: storedChat.unreadCount,
      isOnline: storedChat.isOnline,
      createdAt: storedChat.createdAt,
      updatedAt: storedChat.updatedAt
    };
  }

  clearUnreadCount(chatId: string): void {
    localStorageService.clearUnreadCount(chatId);
    this.emit('unread_count_cleared', { chatId });
  }

  // Connection management
  sendConnectionRequest(mentorId: string, menteeId: string, mentorName: string, menteeName: string, projectId?: string, projectName?: string): void {
    const connection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mentorId,
      menteeId,
      mentorName,
      menteeName,
      status: 'pending',
      projectId,
      projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const storedConnection: StoredConnection = {
      id: connection.id,
      mentorId: connection.mentorId,
      menteeId: connection.menteeId,
      status: connection.status,
      projectId: connection.projectId,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt
    };

    localStorageService.saveConnection(storedConnection);

    if (this.isOnline && webSocketService.isConnected()) {
      webSocketService.sendConnectionRequest(mentorId, menteeId, projectId);
    }

    this.emit('connection_request_sent', connection);
  }

  respondToConnectionRequest(connectionId: string, status: 'accepted' | 'rejected'): void {
    const connections = localStorageService.getConnections();
    const connection = connections.find(c => c.id === connectionId);
    
    if (!connection) return;

    localStorageService.updateConnectionStatus(connectionId, status);

    if (this.isOnline && webSocketService.isConnected()) {
      webSocketService.sendConnectionResponse(connectionId, connection.mentorId, connection.menteeId, status);
    }

    if (status === 'accepted') {
      // Create a chat for accepted connections
      const chat = this.createChat(
        [connection.mentorId, connection.menteeId],
        `Chat with ${connection.mentorId === connection.mentorId ? 'Mentor' : 'Mentee'}`,
        '👥',
        connectionId
      );

      this.emit('connection_accepted', { connectionId, chat });
    } else {
      this.emit('connection_rejected', { connectionId });
    }
  }

  getConnections(): Connection[] {
    const storedConnections = localStorageService.getConnections();
    // Note: This is a simplified version. In a real app, you'd need to fetch user names from a user service
    return storedConnections.map(stored => ({
      id: stored.id,
      mentorId: stored.mentorId,
      menteeId: stored.menteeId,
      mentorName: `Mentor ${stored.mentorId.substr(-4)}`,
      menteeName: `Mentee ${stored.menteeId.substr(-4)}`,
      status: stored.status,
      projectId: stored.projectId,
      projectName: stored.projectId ? `Project ${stored.projectId.substr(-4)}` : undefined,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt
    }));
  }

  getConnectionsByUser(userId: string): Connection[] {
    return this.getConnections().filter(c => c.mentorId === userId || c.menteeId === userId);
  }

  // WebSocket event handlers
  private handleIncomingMessage(data: any): void {
    const message: Message = {
      id: data.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId: data.chatId,
      senderId: data.senderId,
      senderName: data.senderName || 'Unknown User',
      content: data.content,
      timestamp: data.timestamp || new Date().toISOString(),
      messageType: data.messageType || 'text',
      fileUrl: data.fileUrl,
      callMetadata: data.callMetadata,
      isRead: false,
      isDelivered: true
    };

    // Save to local storage
    const storedMessage: StoredMessage = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      callMetadata: message.callMetadata
    };

    localStorageService.saveMessage(storedMessage);
    localStorageService.updateChatLastMessage(data.chatId, data.content, message.timestamp);

    this.emit('message_received', message);
  }

  private handleTypingIndicator(data: any): void {
    this.emit('typing_indicator', {
      chatId: data.chatId,
      userId: data.userId,
      isTyping: data.isTyping
    });
  }

  private handleMessageRead(data: any): void {
    this.emit('message_read', {
      chatId: data.chatId,
      messageId: data.messageId,
      userId: data.userId
    });
  }

  private handleConnectionRequest(data: any): void {
    const connection: Connection = {
      id: data.connectionId,
      mentorId: data.mentorId,
      menteeId: data.menteeId,
      mentorName: data.mentorName || `Mentor ${data.mentorId.substr(-4)}`,
      menteeName: data.menteeName || `Mentee ${data.menteeId.substr(-4)}`,
      status: 'pending',
      projectId: data.projectId,
      projectName: data.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.emit('connection_request_received', connection);
  }

  private handleConnectionAccept(data: any): void {
    localStorageService.updateConnectionStatus(data.connectionId, 'accepted');
    this.emit('connection_accepted', { connectionId: data.connectionId });
  }

  private handleConnectionReject(data: any): void {
    localStorageService.updateConnectionStatus(data.connectionId, 'rejected');
    this.emit('connection_rejected', { connectionId: data.connectionId });
  }

  // Utility methods
  private processMessageQueue(): void {
    if (!this.isOnline || !webSocketService.isConnected()) return;

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    messagesToSend.forEach(message => {
      webSocketService.sendMessage(
        message.chatId,
        message.content,
        message.messageType,
        message.fileUrl,
        message.callMetadata
      );
    });
  }

  getConnectionStatus(): string {
    return webSocketService.getConnectionState();
  }

  isConnected(): boolean {
    return webSocketService.isConnected();
  }

  // Data management
  exportData(): string {
    return localStorageService.exportData();
  }

  importData(jsonData: string): boolean {
    return localStorageService.importData(jsonData);
  }

  clearAllData(): void {
    localStorageService.clearAllData();
    this.messageQueue = [];
    this.emit('data_cleared', {});
  }

  getStorageInfo(): { used: number; available: number } {
    return localStorageService.getStorageSize();
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;
