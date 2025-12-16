import { supabase } from '../client';
import { Routine, DayOfWeek } from '@/types';

/**
 * Get all routines for a user
 * Also syncs to localStorage for offline access
 */
export async function getRoutines(userId: string): Promise<Routine[]> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 most recent routines for performance

    if (error) {
      console.error('[RoutineService] Error getting routines:', error);
      // Fallback to localStorage if Supabase fails
      if (typeof window !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
        return local;
      }
      throw error;
    }

    if (!data) return [];

    // Map database fields to Routine type
    const routines = data.map(routine => ({
      id: routine.id,
      name: routine.name,
      day: routine.day as DayOfWeek,
      exercises: routine.exercises,
      duration: routine.duration,
      isRestDay: routine.is_rest_day || false,
    }));

    // Sync to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('gym-tracker-routines', JSON.stringify(routines));
      console.log('[RoutineService] Synced', routines.length, 'routines to localStorage');
    }

    return routines;
  } catch (error) {
    console.error('[RoutineService] Error in getRoutines:', error);
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
      return local;
    }
    return [];
  }
}

/**
 * Get routine by ID
 */
export async function getRoutineById(id: string): Promise<Routine | null> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[RoutineService] Error getting routine:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      day: data.day as DayOfWeek,
      exercises: data.exercises,
      duration: data.duration,
      isRestDay: data.is_rest_day || false,
    };
  } catch (error) {
    console.error('[RoutineService] Error in getRoutineById:', error);
    return null;
  }
}

/**
 * Get routine by day of week
 */
export async function getRoutineByDay(userId: string, day: DayOfWeek): Promise<Routine | null> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .single();

    if (error) {
      // Not found is ok, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[RoutineService] Error getting routine by day:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      day: data.day as DayOfWeek,
      exercises: data.exercises,
      duration: data.duration,
      isRestDay: data.is_rest_day || false,
    };
  } catch (error) {
    console.error('[RoutineService] Error in getRoutineByDay:', error);
    return null;
  }
}

/**
 * Create a new routine
 */
export async function createRoutine(
  userId: string,
  routine: Omit<Routine, 'id'>
): Promise<Routine | null> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: routine.name,
        day: routine.day,
        exercises: routine.exercises,
        duration: routine.duration,
        is_rest_day: routine.isRestDay || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[RoutineService] Error creating routine:', error);

      // Provide more descriptive error messages
      if (error.code === '23503') {
        throw new Error('Tu perfil no está configurado correctamente. Por favor cierra sesión y vuelve a iniciar.');
      }

      throw error;
    }

    if (!data) {
      throw new Error('No se recibieron datos después de crear la rutina');
    }

    return {
      id: data.id,
      name: data.name,
      day: data.day as DayOfWeek,
      exercises: data.exercises,
      duration: data.duration,
      isRestDay: data.is_rest_day || false,
    };
  } catch (error) {
    console.error('[RoutineService] Error in createRoutine:', error);
    throw error;  // Re-throw instead of silencing
  }
}

/**
 * Update a routine
 */
export async function updateRoutine(
  id: string,
  updates: Partial<Routine>
): Promise<Routine | null> {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.day !== undefined) updateData.day = updates.day;
    if (updates.exercises !== undefined) updateData.exercises = updates.exercises;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.isRestDay !== undefined) updateData.is_rest_day = updates.isRestDay;

    const { data, error } = await supabase
      .from('routines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[RoutineService] Error updating routine:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      day: data.day as DayOfWeek,
      exercises: data.exercises,
      duration: data.duration,
      isRestDay: data.is_rest_day || false,
    };
  } catch (error) {
    console.error('[RoutineService] Error in updateRoutine:', error);
    return null;
  }
}

/**
 * Delete a routine
 */
export async function deleteRoutine(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[RoutineService] Error deleting routine:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[RoutineService] Error in deleteRoutine:', error);
    return false;
  }
}
