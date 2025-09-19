// Local Storage Service for Message Persistence
export interface StoredMessage {
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
}

export interface StoredChat {
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
}

export interface StoredConnection {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

class LocalStorageService {
  private readonly STORAGE_KEYS = {
    MESSAGES: 'vidya-sakthi-messages',
    CHATS: 'vidya-sakthi-chats',
    CONNECTIONS: 'vidya-sakthi-connections',
    USER_PREFERENCES: 'vidya-sakthi-preferences'
  };

  // Message Management
  saveMessage(message: StoredMessage): void {
    try {
      const messages = this.getMessages();
      const existingIndex = messages.findIndex(m => m.id === message.id);
      
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      // Sort by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving message to localStorage:', error);
    }
  }

  getMessages(chatId?: string): StoredMessage[] {
    try {
      const messages = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MESSAGES) || '[]');
      return chatId ? messages.filter((m: StoredMessage) => m.chatId === chatId) : messages;
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  }

  deleteMessage(messageId: string): void {
    try {
      const messages = this.getMessages();
      const filteredMessages = messages.filter(m => m.id !== messageId);
      localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(filteredMessages));
    } catch (error) {
      console.error('Error deleting message from localStorage:', error);
    }
  }

  clearMessages(chatId?: string): void {
    try {
      if (chatId) {
        const messages = this.getMessages();
        const filteredMessages = messages.filter(m => m.chatId !== chatId);
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(filteredMessages));
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.MESSAGES);
      }
    } catch (error) {
      console.error('Error clearing messages from localStorage:', error);
    }
  }

  // Chat Management
  saveChat(chat: StoredChat): void {
    try {
      const chats = this.getChats();
      const existingIndex = chats.findIndex(c => c.id === chat.id);
      
      if (existingIndex >= 0) {
        chats[existingIndex] = { ...chats[existingIndex], ...chat, updatedAt: new Date().toISOString() };
      } else {
        chats.push(chat);
      }
      
      // Sort by last message time
      chats.sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
        return timeB - timeA;
      });
      
      localStorage.setItem(this.STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chat to localStorage:', error);
    }
  }

  getChats(): StoredChat[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CHATS) || '[]');
    } catch (error) {
      console.error('Error loading chats from localStorage:', error);
      return [];
    }
  }

  getChat(chatId: string): StoredChat | null {
    try {
      const chats = this.getChats();
      return chats.find(c => c.id === chatId) || null;
    } catch (error) {
      console.error('Error loading chat from localStorage:', error);
      return null;
    }
  }

  updateChatLastMessage(chatId: string, lastMessage: string, timestamp: string): void {
    try {
      const chats = this.getChats();
      const chatIndex = chats.findIndex(c => c.id === chatId);
      
      if (chatIndex >= 0) {
        chats[chatIndex].lastMessage = lastMessage;
        chats[chatIndex].lastMessageAt = timestamp;
        chats[chatIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.CHATS, JSON.stringify(chats));
      }
    } catch (error) {
      console.error('Error updating chat last message:', error);
    }
  }

  incrementUnreadCount(chatId: string, userId: string): void {
    try {
      const chats = this.getChats();
      const chatIndex = chats.findIndex(c => c.id === chatId);
      
      if (chatIndex >= 0 && !chats[chatIndex].participants.includes(userId)) {
        chats[chatIndex].unreadCount += 1;
        localStorage.setItem(this.STORAGE_KEYS.CHATS, JSON.stringify(chats));
      }
    } catch (error) {
      console.error('Error incrementing unread count:', error);
    }
  }

  clearUnreadCount(chatId: string): void {
    try {
      const chats = this.getChats();
      const chatIndex = chats.findIndex(c => c.id === chatId);
      
      if (chatIndex >= 0) {
        chats[chatIndex].unreadCount = 0;
        localStorage.setItem(this.STORAGE_KEYS.CHATS, JSON.stringify(chats));
      }
    } catch (error) {
      console.error('Error clearing unread count:', error);
    }
  }

  // Connection Management
  saveConnection(connection: StoredConnection): void {
    try {
      const connections = this.getConnections();
      const existingIndex = connections.findIndex(c => c.id === connection.id);
      
      if (existingIndex >= 0) {
        connections[existingIndex] = { ...connections[existingIndex], ...connection, updatedAt: new Date().toISOString() };
      } else {
        connections.push(connection);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    } catch (error) {
      console.error('Error saving connection to localStorage:', error);
    }
  }

  getConnections(): StoredConnection[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONNECTIONS) || '[]');
    } catch (error) {
      console.error('Error loading connections from localStorage:', error);
      return [];
    }
  }

  getConnectionsByUser(userId: string): StoredConnection[] {
    try {
      const connections = this.getConnections();
      return connections.filter(c => c.mentorId === userId || c.menteeId === userId);
    } catch (error) {
      console.error('Error loading user connections from localStorage:', error);
      return [];
    }
  }

  updateConnectionStatus(connectionId: string, status: 'pending' | 'accepted' | 'rejected'): void {
    try {
      const connections = this.getConnections();
      const connectionIndex = connections.findIndex(c => c.id === connectionId);
      
      if (connectionIndex >= 0) {
        connections[connectionIndex].status = status;
        connections[connectionIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
      }
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  }

  // User Preferences
  saveUserPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  getUserPreferences(): any {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES) || '{}');
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {};
    }
  }

  // Utility Methods
  clearAllData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  getStorageSize(): { used: number; available: number } {
    try {
      let used = 0;
      Object.values(this.STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });
      
      // Estimate available space (5MB is typical limit)
      const available = 5 * 1024 * 1024 - used;
      
      return { used, available };
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return { used: 0, available: 0 };
    }
  }

  // Export/Import functionality
  exportData(): string {
    try {
      const data = {
        messages: this.getMessages(),
        chats: this.getChats(),
        connections: this.getConnections(),
        preferences: this.getUserPreferences(),
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.messages) {
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
      }
      if (data.chats) {
        localStorage.setItem(this.STORAGE_KEYS.CHATS, JSON.stringify(data.chats));
      }
      if (data.connections) {
        localStorage.setItem(this.STORAGE_KEYS.CONNECTIONS, JSON.stringify(data.connections));
      }
      if (data.preferences) {
        localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.preferences));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
export default localStorageService;
