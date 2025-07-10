'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        api.setToken(token);
        setUser(JSON.parse(userData));
        // Connect socket if user exists
        const parsedUser = JSON.parse(userData);
        const s = io('http://13.233.216.163:3000', {
          query: { userId: parsedUser.id },
        });
        setSocket(s);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      api.setToken(response.accessToken);
      setUser(response.user);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      // Connect socket on login
      const s = io('http://13.233.216.163:3000', {
        query: { userId: response.user.id },
      });
      setSocket(s);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await api.register({ email, username, password });
      api.setToken(response.accessToken);
      setUser(response.user);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      // Connect socket on register
      const s = io('http://13.233.216.163:3000', {
        query: { userId: response.user.id },
      });
      setSocket(s);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Disconnect socket on logout
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, socket }}>
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