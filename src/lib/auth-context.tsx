'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';
import { supabase } from './supabase/client';
import { validateEmail, validatePassword, validateName } from './validation';
import { getWorkouts } from './supabase/services/workouts';
import { getRoutines } from './supabase/services/routines';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load user profile from Supabase profiles table
  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('[Auth] Loading profile for user:', supabaseUser.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('[Auth] Error loading profile:', error);

        // If profile doesn't exist, create a fallback profile
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, creating fallback profile');
          return {
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            email: supabaseUser.email || '',
            weight: 0,
            height: 0,
            trainingGoal: undefined,
          };
        }

        return null;
      }

      console.log('[Auth] Profile loaded successfully:', profile);

      // Map Supabase profile to User type
      return {
        name: profile.name || 'Usuario',
        email: profile.email || supabaseUser.email || '',
        weight: profile.weight || 0,
        height: profile.height || 0,
        trainingGoal: profile.training_goal,
      };
    } catch (error) {
      console.error('[Auth] Error loading profile:', error);
      return null;
    }
  };

  // Background sync - load routines and workouts to localStorage
  const autoSyncData = async (userId: string) => {
    setIsSyncing(true);
    try {
      // Load routines from Supabase and sync to localStorage
      console.log('[Auth] Syncing routines...');
      await getRoutines(userId);

      // Load workouts from Supabase and sync to localStorage
      console.log('[Auth] Syncing workouts...');
      await getWorkouts(userId);

      console.log('[Auth] Sync completed successfully');
    } catch (error) {
      console.error('[Auth] Sync failed:', error);
      // Continue anyway - app will use localStorage
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('[Auth] Session check timed out after 5s, proceeding anyway');
          setIsLoading(false);
        }, 5000);

        const { data: { session }, error } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (error) {
          console.error('[Auth] Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          try {
            const profile = await loadUserProfile(session.user);
            setUser(profile);

            // Auto-sync data in background
            if (profile) {
              await autoSyncData(session.user.id);
            }
          } catch (profileError) {
            console.error('[Auth] Error loading profile, continuing anyway:', profileError);
            // Set a fallback user even if profile loading fails
            setUser({
              name: session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              weight: 0,
              height: 0,
              trainingGoal: undefined,
            });
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadUserProfile(session.user);
        setUser(profile);

        // Auto-sync data in background
        if (profile) {
          await autoSyncData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await loadUserProfile(session.user);
        setUser(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.value,
        password: password,
      });

      if (error) {
        console.error('[Auth] Login error:', error);

        // Map Supabase errors to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email o contraseña incorrectos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Por favor confirma tu email' };
        }

        return { success: false, error: 'Error al iniciar sesión' };
      }

      if (data.user) {
        const profile = await loadUserProfile(data.user);
        setUser(profile);

        // Sync data from Supabase BEFORE continuing
        // This ensures fresh data is available when user navigates
        await autoSyncData(data.user.id);

        // Auto-cleanup demo account if 7+ days have passed
        if (data.user.email === 'demo@gym.com') {
          try {
            console.log('[Auth] Checking if demo account needs cleanup...');
            const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_demo_account_smart');

            if (cleanupError) {
              console.error('[Auth] Demo cleanup error:', cleanupError);
            } else if (cleanupResult && cleanupResult[0]?.cleaned) {
              console.log('[Auth] Demo account cleaned:', {
                workouts: cleanupResult[0].workouts_deleted,
                routines: cleanupResult[0].routines_deleted
              });
              // Reload localStorage to reflect cleanup
              window.location.reload();
            } else {
              console.log('[Auth] Demo account does not need cleanup yet');
            }
          } catch (cleanupErr) {
            console.error('[Auth] Demo cleanup failed:', cleanupErr);
            // Continue anyway - cleanup is not critical for login
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Login error:', error);
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

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.value,
        password: password,
        options: {
          data: {
            name: nameValidation.value,
          },
        },
      });

      if (error) {
        console.error('[Auth] Register error:', error);

        // Map Supabase errors to user-friendly messages
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'Este email ya está registrado' };
        }

        return { success: false, error: 'Error al registrar usuario' };
      }

      if (data.user) {
        // Profile is created automatically by the trigger in Supabase
        // Load the newly created profile
        const profile = await loadUserProfile(data.user);
        setUser(profile);

        // Sync data from Supabase BEFORE continuing
        await autoSyncData(data.user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Register error:', error);
      return { success: false, error: 'Error al registrar usuario' };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Logout error:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !supabaseUser) {
        console.error('[Auth] Error getting current user:', userError);
        return;
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          weight: updates.weight,
          height: updates.height,
          training_goal: updates.trainingGoal,
        })
        .eq('id', supabaseUser.id);

      if (error) {
        console.error('[Auth] Error updating profile:', error);
        return;
      }

      // Update local state
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('[Auth] Error updating user:', error);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      // Send password reset email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.value, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('[Auth] Reset password error:', error);
        return { success: false, error: 'Error al enviar el correo de recuperación' };
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Reset password error:', error);
      return { success: false, error: 'Error al enviar el correo de recuperación' };
    }
  };

  const isAuthenticated = user !== null;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, login, register, logout, updateUser, resetPassword, isAuthenticated, isLoading, isSyncing }),
    [user, isAuthenticated, isLoading, isSyncing]
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
