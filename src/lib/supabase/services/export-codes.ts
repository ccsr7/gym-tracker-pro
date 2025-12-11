import { supabase } from '../client';

export interface ExportData {
  version: string;
  timestamp: string;
  routines: any[];  // Array de Routine objects
}

export interface SharedCode {
  id: string;
  code: string;
  routine_data: ExportData;
  created_by_user_id?: string;
  created_at: string;
  expires_at: string;
  usage_count: number;
}

/**
 * Genera un código único aleatorio de 8 caracteres
 * Usa caracteres alfanuméricos excluyendo ambiguos (0/O, 1/I, l/1)
 * para evitar confusiones al compartir códigos
 */
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Crea un código de exportación en Supabase
 * Intenta hasta 5 veces si hay colisión de código
 *
 * @param userId - ID del usuario que crea el código
 * @param exportData - Datos de las rutinas a exportar
 * @returns El código generado o null si falla
 */
export async function createExportCode(
  userId: string,
  exportData: ExportData
): Promise<string | null> {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const code = generateUniqueCode();

      console.log(`[ExportCode] Attempting to create code (attempt ${attempt + 1}/${maxRetries}):`, code);

      const { data, error } = await supabase
        .from('shared_routine_codes')
        .insert({
          code: code,
          routine_data: exportData,
          created_by_user_id: userId,
        })
        .select('code')
        .single();

      if (error) {
        // Si es error de unique constraint (código duplicado), reintentar con nuevo código
        if (error.code === '23505') {
          console.log('[ExportCode] Code collision detected, retrying with new code...');
          continue;
        }
        console.error('[ExportCode] Error creating code:', error);
        throw error;
      }

      if (!data) {
        console.error('[ExportCode] No data returned from insert');
        return null;
      }

      console.log('[ExportCode] Code created successfully:', data.code);
      return data.code;
    } catch (error) {
      console.error(`[ExportCode] Error on attempt ${attempt + 1}:`, error);
      if (attempt === maxRetries - 1) {
        console.error('[ExportCode] Max retries reached, giving up');
        return null;
      }
    }
  }

  return null;
}

/**
 * Obtiene datos de rutina desde código de exportación
 * Valida que el código no haya expirado y incrementa el contador de uso
 *
 * @param code - Código de exportación (8 caracteres)
 * @returns Los datos de las rutinas exportadas o null si no se encuentra/expiró
 */
export async function getRoutineFromCode(code: string): Promise<ExportData | null> {
  try {
    console.log('[ExportCode] Fetching routine from code:', code.toUpperCase());

    const { data, error } = await supabase
      .from('shared_routine_codes')
      .select('routine_data, usage_count, expires_at, id')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      // Error PGRST116 significa que no se encontró el registro
      if (error.code === 'PGRST116') {
        console.log('[ExportCode] Code not found:', code);
        return null;
      }
      console.error('[ExportCode] Error fetching code:', error);
      return null;
    }

    if (!data) {
      console.log('[ExportCode] No data found for code:', code);
      return null;
    }

    // Validar que no haya expirado
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      console.log('[ExportCode] Code expired:', code, 'Expired at:', expiresAt);
      return null;
    }

    // Incrementar contador de uso (fire and forget)
    supabase
      .from('shared_routine_codes')
      .update({ usage_count: data.usage_count + 1 })
      .eq('id', data.id)
      .then(() => console.log('[ExportCode] Usage count incremented for code:', code))
      .then(null, err => console.error('[ExportCode] Error incrementing usage count:', err));

    console.log('[ExportCode] Routine data fetched successfully, usage count:', data.usage_count + 1);
    return data.routine_data as ExportData;
  } catch (error) {
    console.error('[ExportCode] Error in getRoutineFromCode:', error);
    return null;
  }
}

/**
 * Obtiene todos los códigos creados por un usuario
 * Útil para futuro feature: "Mis códigos compartidos"
 *
 * @param userId - ID del usuario
 * @returns Array de códigos creados por el usuario
 */
export async function getUserCodes(userId: string): Promise<SharedCode[]> {
  try {
    console.log('[ExportCode] Fetching codes for user:', userId);

    const { data, error } = await supabase
      .from('shared_routine_codes')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ExportCode] Error fetching user codes:', error);
      return [];
    }

    console.log('[ExportCode] Found', data?.length || 0, 'codes for user');
    return data || [];
  } catch (error) {
    console.error('[ExportCode] Error in getUserCodes:', error);
    return [];
  }
}

/**
 * Elimina un código de exportación
 * Solo el creador del código puede eliminarlo (protegido por RLS)
 *
 * @param codeId - ID del código (UUID)
 * @returns true si se eliminó exitosamente
 */
export async function deleteExportCode(codeId: string): Promise<boolean> {
  try {
    console.log('[ExportCode] Deleting code:', codeId);

    const { error } = await supabase
      .from('shared_routine_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      console.error('[ExportCode] Error deleting code:', error);
      return false;
    }

    console.log('[ExportCode] Code deleted successfully');
    return true;
  } catch (error) {
    console.error('[ExportCode] Error in deleteExportCode:', error);
    return false;
  }
}
