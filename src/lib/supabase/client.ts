import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Cliente singleton de Supabase para uso en toda la aplicación
 *
 * Configuración:
 * - auth.persistSession: true - Mantiene sesión en localStorage
 * - auth.autoRefreshToken: true - Refresca token automáticamente
 * - db.schema: 'public' - Esquema por defecto
 *
 * Note: If Supabase env vars are not configured, a placeholder client is created
 * and the app will fallback to localStorage for data storage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Helper para verificar si hay una sesión activa
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Supabase] Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Helper para obtener el usuario actual
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[Supabase] Error getting user:', error);
    return null;
  }
  return user;
}
