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

        // If profile doesn't exist, create it in the database
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, creating it in database...');

          const newProfile = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            email: supabaseUser.email || '',
            created_at: supabaseUser.created_at,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('[Auth] Error creating profile:', createError);
            // If we can't create the profile, return fallback
            return {
              name: newProfile.name,
              email: newProfile.email,
              weight: 0,
              height: 0,
              trainingGoal: undefined,
            };
          }

          console.log('[Auth] Profile created successfully:', createdProfile);

          // Return the newly created profile
          return {
            name: createdProfile.name || 'Usuario',
            email: createdProfile.email || '',
            weight: createdProfile.weight || 0,
            height: createdProfile.height || 0,
            trainingGoal: createdProfile.training_goal,
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
    let isMounted = true;

    // Clean invalid/corrupted tokens before initializing
    const cleanInvalidTokens = () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              JSON.parse(value); // Verify it's valid JSON
            }
          } catch {
            console.warn(`[Auth] Removing corrupted token: ${key}`);
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('[Auth] Error cleaning tokens:', error);
      }
    };

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth...');

        // Add timeout to prevent infinite loading (increased to 30s for slow connections)
        const timeoutId = setTimeout(() => {
          console.warn('[Auth] Session check timed out after 30s, proceeding anyway');
          if (isMounted) {
            setIsLoading(false);
          }
        }, 30000);

        const { data: { session }, error } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (!isMounted) {
          console.log('[Auth] Component unmounted, aborting initialization');
          return;
        }

        if (error) {
          console.error('[Auth] Error getting session:', error);
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Session retrieved:', session ? 'Valid session found' : 'No session');

        if (session?.user) {
          try {
            console.log('[Auth] Loading user profile for:', session.user.email);
            const profile = await loadUserProfile(session.user);

            if (isMounted) {
              setUser(profile);
              console.log('[Auth] User profile loaded successfully');

              // Auto-sync data in background
              if (profile) {
                await autoSyncData(session.user.id);
              }
            }
          } catch (profileError) {
            console.error('[Auth] Error loading profile, continuing anyway:', profileError);
            // Set a fallback user even if profile loading fails
            if (isMounted) {
              setUser({
                name: session.user.email?.split('@')[0] || 'Usuario',
                email: session.user.email || '',
                weight: 0,
                height: 0,
                trainingGoal: undefined,
              });
            }
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    cleanInvalidTokens();
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);

      if (!isMounted) {
        console.log('[Auth] Component unmounted, ignoring auth state change');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] User signed in:', session.user.email);
        const profile = await loadUserProfile(session.user);
        setUser(profile);

        // Auto-sync data in background
        if (profile) {
          await autoSyncData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        setUser(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('[Auth] User updated:', session.user.email);
        const profile = await loadUserProfile(session.user);
        setUser(profile);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed successfully');
      }
    });

    return () => {
      isMounted = false;
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

      // Sign in with Supabase con timeout y reintentos
      let lastError: any = null;
      const maxRetries = 2;
      const timeoutMs = 10000; // 10 segundos

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Auth] Login attempt ${attempt + 1}/${maxRetries + 1}`);

          // Promise con timeout
          const loginPromise = supabase.auth.signInWithPassword({
            email: emailValidation.value,
            password: password,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          );

          const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

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

          // Si llegamos aquí, el login fue exitoso
          if (data.user) {
            const profile = await loadUserProfile(data.user);
            setUser(profile);

            // Start data sync in background without blocking
            autoSyncData(data.user.id).catch(err =>
              console.error('[Auth] Background sync failed:', err)
            );

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
                  // Sync data again to reflect cleanup (no reload needed)
                  await autoSyncData(data.user.id);
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

        } catch (attemptError: any) {
          lastError = attemptError;

          if (attemptError.message === 'Timeout') {
            console.warn(`[Auth] Login attempt ${attempt + 1} timed out`);
            if (attempt < maxRetries) {
              // Esperar 1 segundo antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else {
            // Error no relacionado con timeout, lanzar inmediatamente
            throw attemptError;
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron por timeout
      console.error('[Auth] All login attempts failed');
      return {
        success: false,
        error: 'La conexión está tardando demasiado. Verifica tu internet e intenta de nuevo.'
      };

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
