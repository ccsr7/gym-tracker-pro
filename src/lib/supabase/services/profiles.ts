import { supabase } from '../client';
import { User } from '@/types';

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[ProfileService] Error getting profile:', error);
      throw error;
    }

    if (!data) return null;

    // Map database fields to User type
    return {
      name: data.name,
      email: data.email,
      weight: data.weight,
      height: data.height,
      trainingGoal: data.training_goal,
    };
  } catch (error) {
    console.error('[ProfileService] Error in getProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        weight: updates.weight,
        height: updates.height,
        training_goal: updates.trainingGoal,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[ProfileService] Error updating profile:', error);
      throw error;
    }

    if (!data) return null;

    return {
      name: data.name,
      email: data.email,
      weight: data.weight,
      height: data.height,
      trainingGoal: data.training_goal,
    };
  } catch (error) {
    console.error('[ProfileService] Error in updateProfile:', error);
    return null;
  }
}
