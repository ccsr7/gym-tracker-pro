import { supabase } from '../client';
import { Workout } from '@/types';

/**
 * Get all workouts for a user
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
      throw error;
    }

    if (!data) return [];

    // Map database fields to Workout type
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
    console.error('[WorkoutService] Error in getWorkouts:', error);
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
 */
export async function createWorkout(
  userId: string,
  workout: Omit<Workout, 'id'>
): Promise<Workout | null> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        routine_id: workout.routineId || null,
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
      console.error('[WorkoutService] Error creating workout:', error);
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
    console.error('[WorkoutService] Error in createWorkout:', error);
    return null;
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

    return true;
  } catch (error) {
    console.error('[WorkoutService] Error in deleteWorkout:', error);
    return false;
  }
}
