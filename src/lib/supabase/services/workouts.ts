import { supabase } from '../client';
import { Workout } from '@/types';

/**
 * Sync workouts to localStorage
 * Merges Supabase workouts with existing localStorage workouts to prevent data loss
 */
function syncWorkoutsToLocalStorage(workouts: Workout[]) {
  if (typeof window !== 'undefined') {
    // Get existing localStorage workouts
    const localWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

    // Create a Map of Supabase workouts by ID for quick lookup
    const supabaseMap = new Map(workouts.map(w => [w.id, w]));

    // Merge: Keep local workouts that don't exist in Supabase, add all Supabase workouts
    const mergedWorkouts = [
      ...workouts, // All Supabase workouts (these are the source of truth)
      ...localWorkouts.filter((lw: Workout) => !supabaseMap.has(lw.id)) // Local-only workouts (not yet synced)
    ];

    localStorage.setItem('gym-tracker-workouts', JSON.stringify(mergedWorkouts));
  }
}

/**
 * Get all workouts for a user
 * Returns data from Supabase and syncs to localStorage
 */
export async function getWorkouts(userId: string): Promise<Workout[]> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[WorkoutService] Error getting workouts:', error);
      // Fallback to localStorage if Supabase fails
      if (typeof window !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
        return local;
      }
      throw error;
    }

    if (!data) return [];

    // Map database fields to Workout type
    const workouts = data.map(workout => ({
      id: workout.id,
      date: workout.date,
      routineId: workout.routine_id || '',
      routineName: workout.routine_name,
      exercises: workout.exercises,
      duration: workout.duration,
      notes: workout.notes,
      rpe: workout.rpe,
      totalVolume: workout.total_volume ? parseFloat(workout.total_volume) : undefined,
    }));

    // Sync to localStorage
    syncWorkoutsToLocalStorage(workouts);

    return workouts;
  } catch (error) {
    console.error('[WorkoutService] Error in getWorkouts:', error);
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      return local;
    }
    return [];
  }
}

/**
 * Get workouts by date range
 */
export async function getWorkoutsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Workout[]> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('[WorkoutService] Error getting workouts by date range:', error);
      throw error;
    }

    if (!data) return [];

    return data.map(workout => ({
      id: workout.id,
      date: workout.date,
      routineId: workout.routine_id || '',
      routineName: workout.routine_name,
      exercises: workout.exercises,
      duration: workout.duration,
      notes: workout.notes,
      rpe: workout.rpe,
      totalVolume: workout.total_volume ? parseFloat(workout.total_volume) : undefined,
    }));
  } catch (error) {
    console.error('[WorkoutService] Error in getWorkoutsByDateRange:', error);
    return [];
  }
}

/**
 * Get workout by ID
 */
export async function getWorkoutById(id: string): Promise<Workout | null> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[WorkoutService] Error getting workout:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      routineId: data.routine_id || '',
      routineName: data.routine_name,
      exercises: data.exercises,
      duration: data.duration,
      notes: data.notes,
      rpe: data.rpe,
      totalVolume: data.total_volume ? parseFloat(data.total_volume) : undefined,
    };
  } catch (error) {
    console.error('[WorkoutService] Error in getWorkoutById:', error);
    return null;
  }
}

/**
 * Create a new workout
 * Saves to both Supabase and localStorage
 */
export async function createWorkout(
  userId: string,
  workout: Omit<Workout, 'id'>
): Promise<Workout | null> {
  try {
    console.log('[WorkoutService] Creating workout for user:', userId);
    console.log('[WorkoutService] Workout data:', workout);

    // Validate routineId is a valid UUID, otherwise set to null
    // Old routines from localStorage have timestamp IDs like "1764126495100"
    const isValidUUID = workout.routineId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workout.routineId);
    const routineId = isValidUUID ? workout.routineId : null;

    if (!isValidUUID && workout.routineId) {
      console.log('[WorkoutService] Invalid UUID for routineId:', workout.routineId, '- setting to null');
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        routine_id: routineId,
        routine_name: workout.routineName,
        date: workout.date,
        exercises: workout.exercises,
        duration: workout.duration,
        notes: workout.notes,
        rpe: workout.rpe,
        total_volume: workout.totalVolume,
      })
      .select()
      .single();

    if (error) {
      console.error('[WorkoutService] Supabase error creating workout:', error);
      console.error('[WorkoutService] Error code:', error.code);
      console.error('[WorkoutService] Error message:', error.message);
      console.error('[WorkoutService] Error details:', error.details);
      throw error;
    }

    if (!data) {
      console.error('[WorkoutService] No data returned from Supabase');
      return null;
    }

    console.log('[WorkoutService] Workout created successfully:', data);

    const newWorkout: Workout = {
      id: data.id,
      date: data.date,
      routineId: data.routine_id || '',
      routineName: data.routine_name,
      exercises: data.exercises,
      duration: data.duration,
      notes: data.notes,
      rpe: data.rpe,
      totalVolume: data.total_volume ? parseFloat(data.total_volume) : undefined,
    };

    // Also save to localStorage
    if (typeof window !== 'undefined') {
      const existingWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      existingWorkouts.push(newWorkout);
      localStorage.setItem('gym-tracker-workouts', JSON.stringify(existingWorkouts));
      console.log('[WorkoutService] Saved to localStorage, total workouts:', existingWorkouts.length);
    }

    return newWorkout;
  } catch (error) {
    console.error('[WorkoutService] Fatal error in createWorkout:', error);
    // Re-throw the error instead of returning null so the caller knows it failed
    throw error;
  }
}

/**
 * Update a workout
 */
export async function updateWorkout(
  id: string,
  updates: Partial<Workout>
): Promise<Workout | null> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update({
        routine_id: updates.routineId,
        routine_name: updates.routineName,
        date: updates.date,
        exercises: updates.exercises,
        duration: updates.duration,
        notes: updates.notes,
        rpe: updates.rpe,
        total_volume: updates.totalVolume,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[WorkoutService] Error updating workout:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      routineId: data.routine_id || '',
      routineName: data.routine_name,
      exercises: data.exercises,
      duration: data.duration,
      notes: data.notes,
      rpe: data.rpe,
      totalVolume: data.total_volume ? parseFloat(data.total_volume) : undefined,
    };
  } catch (error) {
    console.error('[WorkoutService] Error in updateWorkout:', error);
    return null;
  }
}

/**
 * Delete a workout
 * Deletes from both Supabase and localStorage
 */
export async function deleteWorkout(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[WorkoutService] Error deleting workout:', error);
      throw error;
    }

    // Also delete from localStorage
    if (typeof window !== 'undefined') {
      const existingWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      const updated = existingWorkouts.filter((w: Workout) => w.id !== id);
      localStorage.setItem('gym-tracker-workouts', JSON.stringify(updated));
    }

    return true;
  } catch (error) {
    console.error('[WorkoutService] Error in deleteWorkout:', error);
    return false;
  }
}
