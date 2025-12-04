import { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types';
import { exercisesDatabase, getExerciseById } from '@/data/exercises';

/**
 * Obtiene ejercicios similares filtrados por categoría
 * @param currentExerciseId - ID del ejercicio actual
 * @param filterByCategory - Filtrar por la misma categoría (default: true)
 * @returns Array de ejercicios similares
 */
export function getSimilarExercises(
  currentExerciseId: string,
  filterByCategory: boolean = true
): Exercise[] {
  const currentExercise = getExerciseById(currentExerciseId);
  if (!currentExercise) return [];

  return exercisesDatabase.filter(ex => {
    // No incluir el mismo ejercicio
    if (ex.id === currentExerciseId) return false;

    // Filtrar por categoría
    if (filterByCategory && ex.category !== currentExercise.category) {
      return false;
    }

    return true;
  });
}

/**
 * Obtiene los datos del último entrenamiento de un ejercicio específico
 * @param exerciseId - ID del ejercicio
 * @returns Objeto con peso máximo y reps promedio, o null si no hay historial
 */
export function getExerciseLastWorkoutData(exerciseId: string): { weight: number; reps: number } | null {
  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  const lastWorkoutWithExercise = workouts
    .filter((w: Workout) => w.exercises.some((ex: WorkoutExercise) => ex.exerciseId === exerciseId))
    .sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!lastWorkoutWithExercise) return null;

  const lastExercise = lastWorkoutWithExercise.exercises.find((ex: WorkoutExercise) => ex.exerciseId === exerciseId);
  if (!lastExercise) return null;

  const completedSets = lastExercise.sets.filter((s: WorkoutSet) => s.completed);
  if (completedSets.length === 0) return null;

  const maxWeight = Math.max(...completedSets.map((s: WorkoutSet) => s.weight));
  const avgReps = Math.round(completedSets.reduce((sum: number, s: WorkoutSet) => sum + s.reps, 0) / completedSets.length);

  return { weight: maxWeight, reps: avgReps };
}

/**
 * Genera series pre-cargadas basadas en el historial del ejercicio
 * @param newExerciseId - ID del nuevo ejercicio
 * @param numSets - Número de series a crear
 * @returns Array de sets con datos pre-cargados o inicializados en 0
 */
export function generateSetsForExercise(newExerciseId: string, numSets: number): WorkoutSet[] {
  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  const lastWorkoutWithExercise = workouts
    .filter((w: Workout) => w.exercises.some((ex: WorkoutExercise) => ex.exerciseId === newExerciseId))
    .sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastWorkoutWithExercise) {
    // Encontró historial - pre-cargar datos
    const lastExercise = lastWorkoutWithExercise.exercises.find((ex: WorkoutExercise) => ex.exerciseId === newExerciseId);
    const completedSets = lastExercise?.sets.filter((s: WorkoutSet) => s.completed) || [];

    if (completedSets.length > 0) {
      // Crear el mismo número de series solicitadas
      return Array(numSets).fill(null).map((_, idx) => {
        if (completedSets[idx]) {
          return {
            reps: completedSets[idx].reps,
            weight: completedSets[idx].weight,
            completed: false
          };
        }
        // Si no hay suficientes series en el historial, usar la última serie
        const lastSet = completedSets[completedSets.length - 1];
        return {
          reps: lastSet.reps,
          weight: lastSet.weight,
          completed: false
        };
      });
    }
  }

  // No hay historial o no hay series completadas - inicializar en 0
  return Array(numSets).fill(null).map(() => ({
    reps: 0,
    weight: 0,
    completed: false
  }));
}
