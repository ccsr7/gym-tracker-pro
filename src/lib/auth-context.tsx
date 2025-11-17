'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('gym-tracker-user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('User loaded from localStorage:', parsedUser);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gym-tracker-user');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (email: string, password: string): boolean => {
    try {
      console.log('Login attempt:', { email, password });

      const storedUsers = JSON.parse(localStorage.getItem('gym-tracker-users') || '[]');
      console.log('Stored users:', storedUsers);

      const foundUser = storedUsers.find((u: any) =>
        u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
        u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        console.log('Login successful:', userWithoutPassword);

        setUser(userWithoutPassword);
        localStorage.setItem('gym-tracker-user', JSON.stringify(userWithoutPassword));
        return true;
      }

      console.log('Login failed: User not found');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = (name: string, email: string, password: string): boolean => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('gym-tracker-users') || '[]');

      if (storedUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        return false;
      }

      const newUser = { name, email, password };
      storedUsers.push(newUser);
      localStorage.setItem('gym-tracker-users', JSON.stringify(storedUsers));

      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('gym-tracker-user', JSON.stringify(userWithoutPassword));
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gym-tracker-user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('gym-tracker-user', JSON.stringify(updatedUser));

      // También actualizar en el array de usuarios
      const storedUsers = JSON.parse(localStorage.getItem('gym-tracker-users') || '[]');
      const userIndex = storedUsers.findIndex((u: any) => u.email === user.email);
      if (userIndex !== -1) {
        storedUsers[userIndex] = { ...storedUsers[userIndex], ...updates };
        localStorage.setItem('gym-tracker-users', JSON.stringify(storedUsers));
      }
    }
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated, isLoading }}>
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
