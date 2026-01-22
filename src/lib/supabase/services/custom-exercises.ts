import { supabase } from '../client';
import { Exercise } from '@/types';

export interface CustomExercise {
  id: string;
  user_id: string;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
  instructions?: string[];
  form_tips?: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  variations?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a CustomExercise from Supabase format to Exercise format
 */
export function customExerciseToExercise(customEx: CustomExercise): Exercise {
  return {
    id: `custom-${customEx.id}`,
    name: customEx.name,
    category: customEx.category,
    muscleGroup: customEx.muscle_group,
    equipment: customEx.equipment,
    image: customEx.image_url || '/exercises/placeholder.jpg',
    difficulty: customEx.difficulty,
    instructions: customEx.instructions || [],
    formTips: customEx.form_tips || [],
    primaryMuscles: customEx.primary_muscles || [],
    secondaryMuscles: customEx.secondary_muscles || [],
    variations: customEx.variations || [],
  };
}

/**
 * Get all custom exercises for a user
 */
export async function getUserCustomExercises(userId: string): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CustomExercises] Error fetching custom exercises:', error);
      return [];
    }

    // Convert to Exercise format
    return (data || []).map(customExerciseToExercise);
  } catch (error) {
    console.error('[CustomExercises] Error fetching custom exercises:', error);
    return [];
  }
}

/**
 * Create a new custom exercise
 */
export async function createCustomExercise(
  userId: string,
  exerciseData: {
    name: string;
    category: string;
    muscleGroup: string;
    equipment: string;
    difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
    instructions?: string[];
    formTips?: string[];
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    imageUrl?: string;
  }
): Promise<{ success: boolean; error?: string; exercise?: Exercise }> {
  try {
    console.log('[CustomExercises] Creating exercise for user:', userId);
    console.log('[CustomExercises] Exercise data:', exerciseData);

    // Agregar timeout de 10 segundos
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 10000);
    });

    const insertPromise = supabase
      .from('custom_exercises')
      .insert({
        user_id: userId,
        name: exerciseData.name,
        category: exerciseData.category,
        muscle_group: exerciseData.muscleGroup,
        equipment: exerciseData.equipment,
        difficulty: exerciseData.difficulty,
        instructions: exerciseData.instructions || [],
        form_tips: exerciseData.formTips || [],
        primary_muscles: exerciseData.primaryMuscles || [],
        secondary_muscles: exerciseData.secondaryMuscles || [],
        variations: [],
        image_url: exerciseData.imageUrl,
      })
      .select()
      .single();

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      console.error('[CustomExercises] Supabase error creating exercise:', error);
      console.error('[CustomExercises] Error code:', error.code);
      console.error('[CustomExercises] Error message:', error.message);
      console.error('[CustomExercises] Error details:', error.details);

      // MEJORADO: Mensajes específicos según código de error
      if (error.code === '42501') {
        return { success: false, error: 'No tienes permisos para crear ejercicios. Verifica las políticas de seguridad en Supabase.' };
      } else if (error.code === '23503') {
        return { success: false, error: 'Tu perfil no está configurado correctamente. Cierra sesión y vuelve a iniciar.' };
      } else {
        return { success: false, error: `Error de base de datos: ${error.message}` };
      }
    }

    if (!data) {
      console.error('[CustomExercises] No data returned after insert');
      return { success: false, error: 'No se recibieron datos después de crear el ejercicio' };
    }

    console.log('[CustomExercises] Exercise created successfully:', data);

    return {
      success: true,
      exercise: customExerciseToExercise(data),
    };
  } catch (error) {
    console.error('[CustomExercises] Unexpected error creating exercise:', error);

    // Manejar timeout específicamente
    if (error instanceof Error && error.message === 'TIMEOUT') {
      return { success: false, error: 'La operación tardó demasiado. Verifica tu conexión o que la tabla custom_exercises exista en Supabase.' };
    }

    return { success: false, error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

/**
 * Update a custom exercise
 */
export async function updateCustomExercise(
  exerciseId: string,
  updates: {
    name?: string;
    category?: string;
    muscleGroup?: string;
    equipment?: string;
    difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
    instructions?: string[];
    formTips?: string[];
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    imageUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove 'custom-' prefix if present
    const realId = exerciseId.startsWith('custom-') ? exerciseId.substring(7) : exerciseId;

    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.muscleGroup !== undefined) updateData.muscle_group = updates.muscleGroup;
    if (updates.equipment !== undefined) updateData.equipment = updates.equipment;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.formTips !== undefined) updateData.form_tips = updates.formTips;
    if (updates.primaryMuscles !== undefined) updateData.primary_muscles = updates.primaryMuscles;
    if (updates.secondaryMuscles !== undefined) updateData.secondary_muscles = updates.secondaryMuscles;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

    const { error } = await supabase
      .from('custom_exercises')
      .update(updateData)
      .eq('id', realId);

    if (error) {
      console.error('[CustomExercises] Error updating custom exercise:', error);
      return { success: false, error: 'Error al actualizar el ejercicio' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CustomExercises] Error updating custom exercise:', error);
    return { success: false, error: 'Error al actualizar el ejercicio' };
  }
}

/**
 * Delete a custom exercise
 */
export async function deleteCustomExercise(exerciseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove 'custom-' prefix if present
    const realId = exerciseId.startsWith('custom-') ? exerciseId.substring(7) : exerciseId;

    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', realId);

    if (error) {
      console.error('[CustomExercises] Error deleting custom exercise:', error);
      return { success: false, error: 'Error al eliminar el ejercicio' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CustomExercises] Error deleting custom exercise:', error);
    return { success: false, error: 'Error al eliminar el ejercicio' };
  }
}

/**
 * Upload an image for a custom exercise to Supabase Storage
 */
export async function uploadCustomExerciseImage(
  userId: string,
  file: File
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'El archivo debe ser una imagen' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'La imagen debe ser menor a 5MB' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('custom-exercises')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[CustomExercises] Error uploading image:', error);
      return { success: false, error: 'Error al subir la imagen' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('custom-exercises')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('[CustomExercises] Error uploading image:', error);
    return { success: false, error: 'Error al subir la imagen' };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteCustomExerciseImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/custom-exercises/');
    if (pathParts.length < 2) {
      return { success: false, error: 'URL de imagen inválida' };
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('custom-exercises')
      .remove([filePath]);

    if (error) {
      console.error('[CustomExercises] Error deleting image:', error);
      return { success: false, error: 'Error al eliminar la imagen' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CustomExercises] Error deleting image:', error);
    return { success: false, error: 'Error al eliminar la imagen' };
  }
}
