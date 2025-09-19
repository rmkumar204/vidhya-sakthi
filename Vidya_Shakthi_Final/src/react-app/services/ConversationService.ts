// Frontend service for conversations with real-time communication
export interface ConversationMessage {
  _id: string;
  sender: string | {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  content: string;
  timestamp: string;
  edited?: boolean;
  edited_at?: string;
  message_type: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'audio_call' | 'call_started' | 'call_ended' | 'screen_share_started' | 'screen_share_ended';
  file_url?: string;
  call_duration?: number;
  call_metadata?: {
    callId: string;
    callType: 'audio' | 'video';
    participants: string[];
    startTime: string;
    endTime?: string;
  };
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }>;
  project: {
    _id: string;
    title: string;
    description?: string;
  };
  connection_request: string;
  messages: ConversationMessage[];
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  is_active: boolean;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SendMessagePayload {
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'audio_call' | 'call_started' | 'call_ended' | 'screen_share_started' | 'screen_share_ended';
  file_url?: string;
  call_duration?: number;
  call_metadata?: {
    callId: string;
    callType: 'audio' | 'video';
    participants: string[];
    startTime: string;
    endTime?: string;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function getConversations(
  params: { page?: number; limit?: number } = {},
  token: string
): Promise<ConversationListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') query.append(k, String(v));
  });
  
  const res = await fetch(`${API_BASE}/conversations?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch conversations');
  }
  
  return res.json();
}

export async function getConversation(
  conversationId: string,
  params: { page?: number; limit?: number } = {},
  token: string
): Promise<ConversationDetailResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') query.append(k, String(v));
  });
  
  const res = await fetch(`${API_BASE}/conversations/${conversationId}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch conversation');
  }
  
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
  token: string
): Promise<{ message: ConversationMessage; conversation: Partial<Conversation> }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to send message');
  }
  
  return res.json();
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string,
  token: string
): Promise<{ message: ConversationMessage }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to edit message');
  }
  
  return res.json();
}

export async function deleteConversation(
  conversationId: string,
  token: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete conversation');
  }
  
  return res.json();
}

// Real-time messaging with WebSocket integration
export class RealTimeConversationService {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  constructor(private token: string, private userId: string) {}

  connect(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:8080?userId=${this.userId}&conversationId=${conversationId}&token=${this.token}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Real-time conversation WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("handled event q------------------");
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Real-time conversation WebSocket disconnected');
          this.handleReconnect(conversationId);
        };

        this.ws.onerror = (error) => {
          console.error('Real-time conversation WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

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

  sendMessage(content: string, messageType: string = 'text', callMetadata?: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content,
        message_type: messageType,
        call_metadata: callMetadata,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendTyping(isTyping: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        isTyping,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private handleMessage(message: any): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleReconnect(conversationId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(conversationId).catch(console.error);
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

// Call management functions
export async function logCallStart(
  conversationId: string,
  callMetadata: {
    callId: string;
    callType: 'audio' | 'video';
    participants: string[];
    startTime: string;
  },
  token: string
): Promise<{ message: ConversationMessage }> {
  return sendMessage(
    conversationId,
    {
      content: `📞 ${callMetadata.callType === 'video' ? 'Video' : 'Audio'} call started`,
      message_type: 'call_started',
      call_metadata: callMetadata
    },
    token
  );
}

export async function logCallEnd(
  conversationId: string,
  callMetadata: {
    callId: string;
    callType: 'audio' | 'video';
    participants: string[];
    startTime: string;
    endTime: string;
    duration: number;
  },
  token: string
): Promise<{ message: ConversationMessage }> {
  return sendMessage(
    conversationId,
    {
      content: `📞 ${callMetadata.callType === 'video' ? 'Video' : 'Audio'} call ended (${Math.floor(callMetadata.duration / 60)}:${(callMetadata.duration % 60).toString().padStart(2, '0')})`,
      message_type: 'call_ended',
      call_duration: callMetadata.duration,
      call_metadata: callMetadata
    },
    token
  );
}

export async function logScreenShareStart(
  conversationId: string,
  token: string
): Promise<{ message: ConversationMessage }> {
  return sendMessage(
    conversationId,
    {
      content: '🖥️ Screen sharing started',
      message_type: 'screen_share_started'
    },
    token
  );
}

export async function logScreenShareEnd(
  conversationId: string,
  token: string
): Promise<{ message: ConversationMessage }> {
  return sendMessage(
    conversationId,
    {
      content: '🖥️ Screen sharing ended',
      message_type: 'screen_share_ended'
    },
    token
  );
}