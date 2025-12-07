import { supabase } from '../client';
import { RestDay, RestDayReason } from '@/types';

/**
 * Get all rest days for a user
 */
export async function getRestDays(userId: string): Promise<RestDay[]> {
  try {
    const { data, error } = await supabase
      .from('rest_days')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[RestDayService] Error getting rest days:', error);
      throw error;
    }

    if (!data) return [];

    // Map database fields to RestDay type
    return data.map(restDay => ({
      id: restDay.id,
      date: restDay.date,
      reason: restDay.reason as RestDayReason,
      notes: restDay.notes,
      createdAt: restDay.created_at,
    }));
  } catch (error) {
    console.error('[RestDayService] Error in getRestDays:', error);
    return [];
  }
}

/**
 * Get rest day by ID
 */
export async function getRestDayById(id: string): Promise<RestDay | null> {
  try {
    const { data, error } = await supabase
      .from('rest_days')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[RestDayService] Error getting rest day:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      reason: data.reason as RestDayReason,
      notes: data.notes,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('[RestDayService] Error in getRestDayById:', error);
    return null;
  }
}

/**
 * Create a new rest day
 */
export async function createRestDay(
  userId: string,
  restDay: Omit<RestDay, 'id' | 'createdAt'>
): Promise<RestDay | null> {
  try {
    const { data, error } = await supabase
      .from('rest_days')
      .insert({
        user_id: userId,
        date: restDay.date,
        reason: restDay.reason,
        notes: restDay.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[RestDayService] Error creating rest day:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      reason: data.reason as RestDayReason,
      notes: data.notes,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('[RestDayService] Error in createRestDay:', error);
    return null;
  }
}

/**
 * Update a rest day
 */
export async function updateRestDay(
  id: string,
  updates: Partial<Omit<RestDay, 'id' | 'createdAt'>>
): Promise<RestDay | null> {
  try {
    const updateData: any = {};

    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.reason !== undefined) updateData.reason = updates.reason;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('rest_days')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[RestDayService] Error updating rest day:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      reason: data.reason as RestDayReason,
      notes: data.notes,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('[RestDayService] Error in updateRestDay:', error);
    return null;
  }
}

/**
 * Delete a rest day
 */
export async function deleteRestDay(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rest_days')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[RestDayService] Error deleting rest day:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[RestDayService] Error in deleteRestDay:', error);
    return false;
  }
}
