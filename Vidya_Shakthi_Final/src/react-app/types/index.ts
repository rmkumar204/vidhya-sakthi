export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'image' | 'file';
  isRead: boolean;
  isDelivered: boolean;
}

export interface Chat {
  id: string;
  userIds: string[];
  users: User[];
  messages: Message[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  message?: string;
}

export interface Call {
  id: string;
  type: 'audio' | 'video';
  status: CallStatus;
  from: User;
  to: User;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export enum CallStatus {
  IDLE = 'idle',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended'
}