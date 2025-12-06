'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import bcrypt from 'bcryptjs';
import { User } from '@/types';
import { storageService, STORAGE_KEYS } from './storage-service';
import { validateEmail, validatePassword, validateName } from './validation';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour

interface StoredUser {
  name: string;
  email: string;
  passwordHash: string;
  // Old format compatibility
  password?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      const storedUser = storageService.get<User | null>(STORAGE_KEYS.USER, null);
      if (storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Check if user is rate-limited
  const checkRateLimit = (email: string): { allowed: boolean; error?: string } => {
    const attempt = loginAttempts.get(email);

    if (!attempt) {
      return { allowed: true };
    }

    const now = Date.now();
    const timeSinceLastAttempt = now - attempt.lastAttempt;

    // Reset if lockout duration has passed
    if (timeSinceLastAttempt > LOCKOUT_DURATION) {
      loginAttempts.delete(email);
      return { allowed: true };
    }

    // Check if locked out
    if (attempt.count >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
      return {
        allowed: false,
        error: `Demasiados intentos. Intenta de nuevo en ${remainingTime} minuto(s)`
      };
    }

    return { allowed: true };
  };

  // Record login attempt
  const recordLoginAttempt = (email: string, success: boolean) => {
    if (success) {
      loginAttempts.delete(email);
      return;
    }

    const attempt = loginAttempts.get(email);
    const now = Date.now();

    if (!attempt) {
      loginAttempts.set(email, { count: 1, lastAttempt: now });
    } else {
      loginAttempts.set(email, {
        count: attempt.count + 1,
        lastAttempt: now
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate inputs
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Check rate limit
      const rateLimit = checkRateLimit(emailValidation.value);
      if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error };
      }

      // Get stored users
      const storedUsers = storageService.get<StoredUser[]>(STORAGE_KEYS.USERS, []);

      const foundUser = storedUsers.find((u: StoredUser) =>
        u.email.toLowerCase() === emailValidation.value.toLowerCase()
      );

      if (!foundUser) {
        recordLoginAttempt(emailValidation.value, false);
        return { success: false, error: 'Email o contraseña incorrectos' };
      }

      // Check password - support both old (plaintext) and new (hashed) formats
      let passwordMatch = false;

      if (foundUser.passwordHash) {
        // New format - hashed password
        passwordMatch = await bcrypt.compare(password, foundUser.passwordHash);
      } else if (foundUser.password) {
        // Old format - plaintext password (migrate to hashed)
        passwordMatch = foundUser.password === password;

        // Migrate to hashed password
        if (passwordMatch) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const updatedUsers = storedUsers.map(u =>
            u.email === foundUser.email
              ? { ...u, passwordHash: hashedPassword, password: undefined }
              : u
          );
          storageService.set(STORAGE_KEYS.USERS, updatedUsers);
        }
      }

      if (!passwordMatch) {
        recordLoginAttempt(emailValidation.value, false);
        return { success: false, error: 'Email o contraseña incorrectos' };
      }

      // Login successful
      recordLoginAttempt(emailValidation.value, true);

      const { passwordHash: _, password: __, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      storageService.set(STORAGE_KEYS.USER, userWithoutPassword);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate inputs
      const nameValidation = validateName(name);
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error };
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Get stored users
      const storedUsers = storageService.get<StoredUser[]>(STORAGE_KEYS.USERS, []);

      // Check if email already exists
      if (storedUsers.some((u: StoredUser) => u.email.toLowerCase() === emailValidation.value.toLowerCase())) {
        return { success: false, error: 'Este email ya está registrado' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newStoredUser: StoredUser = {
        name: nameValidation.value,
        email: emailValidation.value,
        passwordHash: hashedPassword
      };

      storedUsers.push(newStoredUser);
      storageService.set(STORAGE_KEYS.USERS, storedUsers);

      // Set current user (without password)
      const { passwordHash: _, ...userWithoutPassword } = newStoredUser;
      setUser(userWithoutPassword as User);
      storageService.set(STORAGE_KEYS.USER, userWithoutPassword);

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Error al registrar usuario' };
    }
  };

  const logout = () => {
    setUser(null);
    storageService.remove(STORAGE_KEYS.USER);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      storageService.set(STORAGE_KEYS.USER, updatedUser);

      // También actualizar en el array de usuarios
      const storedUsers = storageService.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const userIndex = storedUsers.findIndex((u: StoredUser) => u.email === user.email);
      if (userIndex !== -1) {
        storedUsers[userIndex] = { ...storedUsers[userIndex], ...updates };
        storageService.set(STORAGE_KEYS.USERS, storedUsers);
      }
    }
  };

  const isAuthenticated = user !== null;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, login, register, logout, updateUser, isAuthenticated, isLoading }),
    [user, isAuthenticated, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
