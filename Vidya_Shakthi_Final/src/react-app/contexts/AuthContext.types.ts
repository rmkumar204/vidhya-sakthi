import { createContext } from 'react';

export type UserRole = 'mentor' | 'mentee' | 'reviewer' | 'state_admin' | 'super_admin';

export interface User {
  // id: string;
  // name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  redirectToLogin: (role?: UserRole) => void;
  exchangeCodeForSessionToken: (code: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
