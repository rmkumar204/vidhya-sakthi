import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'mentor' | 'mentee' | 'reviewer' | 'state_admin' | 'super_admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  exchangeCodeForSessionToken: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
    // For demo purposes, start with a mentor user
    // return {
    //   id: '1',
    //   name: 'John Doe',
    //   email: 'john.doe@email.com',
    //   role: 'mentor',
    //   avatar: '🧑‍🏫'
    // };
    return null;
  });

   const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
  };


  const isAuthenticated = !!user;

  const exchangeCodeForSessionToken = async (code: string) => {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,   // ✅ Vite style env vars
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          redirect_uri: "http://localhost:5173/auth/callback",
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const data = await response.json();

      // Save token securely (demo = localStorage, but real apps should use httpOnly cookies)
      localStorage.setItem("access_token", data.access_token);

      // If provider returns `id_token`, decode it to extract user profile
      if (data.id_token) {
        const base64Url = data.id_token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));

        const userData: User = {
          id: decodedPayload.sub,
          name: decodedPayload.name,
          email: decodedPayload.email,
          role: "mentee", // 👈 default or map based on your app logic
          avatar: decodedPayload.picture,
        };

        login(userData);
      }
    } catch (err) {
      console.error("Error exchanging code:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, exchangeCodeForSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


