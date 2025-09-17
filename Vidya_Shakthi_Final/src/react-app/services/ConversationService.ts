// Frontend service for conversations
export interface ConversationMessage {
  _id: string;
  sender: {
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
  message_type: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'audio_call';
  file_url?: string;
  call_duration?: number;
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
  message_type?: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'audio_call';
  file_url?: string;
  call_duration?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function getConversations(
  params: { page?: number; limit?: number } = {},
  token: string
): Promise<ConversationListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
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
    if (v !== undefined && v !== '') query.append(k, String(v));
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