import React from 'react';
import { User } from './types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sendConnectionRequest: (toUserId: string) => Promise<void>;
  handleConnectionRequest: (requestId: string, action: 'accept' | 'reject') => Promise<void>;
  initiateCall: (user: User, type: 'video' | 'audio') => void;
}

export const AppContext = React.createContext<AppContextType | null>(null);
