import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, User, UserRole } from "./AuthContext.types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  /** ✅ Save user in state + localStorage */
   const login = (userData: User) => {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData)); 
  };

  /** ✅ Clear user + token and send back to role selection/login */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    redirectToLogin();
  };

  /** ✅ Navigate back to login/role page */
  const redirectToLogin = (role?: UserRole) => {
    const path = role ? `/login/${role}` : "/";
    navigate(path);
  };

  const isAuthenticated = !!user;

  /** ✅ Handle Google OAuth code → session token + user profile */
  const exchangeCodeForSessionToken = async (code: string): Promise<void> => {
    setIsPending(true);
    try {
      // ---- STEP 1: Hit your backend to exchange code ----
      const response = await fetch(
        "http://localhost:3000/api/auth/google/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to exchange code for token (backend)");
      }

      const backendData = await response.json();
      login(backendData); // assumes backend returns user object
    } catch (error) {
      console.error("Backend token exchange error:", error);
    } finally {
      setIsPending(false);
    }

    try {
      // ---- STEP 2: Directly hit Google for OAuth token (optional) ----
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          redirect_uri: "http://localhost:5173/auth/callback",
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange code with Google");
      }

      const data = await response.json();

      // ✅ Save token (for demo use localStorage, for prod use httpOnly cookie)
      localStorage.setItem("access_token", data.access_token);

      // ✅ If Google returned id_token, decode user info
      if (data.id_token) {
        const base64Url = data.id_token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));

        const userData: User = {
          id: decodedPayload.sub,
          name: decodedPayload.name,
          email: decodedPayload.email,
          role: "mentee", // default, or adjust based on your app logic
          avatar: decodedPayload.picture,
        };

        login(userData);
      }
    } catch (err) {
      console.error("Google token exchange error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        isPending,
        redirectToLogin,
        exchangeCodeForSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
