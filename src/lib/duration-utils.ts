// Utilidades para calcular duración de entrenamientos

/**
 * Calcula la duración total de todos los entrenamientos completados
 * @param routineId ID de la rutina (opcional). Si se proporciona, solo cuenta esa rutina
 * @returns Duración total en minutos, o null si no hay datos
 */
export function getTotalWorkoutDuration(routineId?: string): number | null {
  if (typeof window === 'undefined') return null;

  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  if (workouts.length === 0) return null;

  // Filtrar por rutina si se especifica
  const filteredWorkouts = routineId
    ? workouts.filter((w: any) => w.routineId === routineId)
    : workouts;

  if (filteredWorkouts.length === 0) return null;

  const totalDuration = filteredWorkouts.reduce((sum: number, workout: any) => {
    return sum + (workout.duration || 0);
  }, 0);

  return totalDuration;
}

/**
 * Calcula la duración promedio de entrenamientos completados
 * @param routineId ID de la rutina (opcional). Si se proporciona, solo calcula para esa rutina
 * @returns Duración promedio en minutos, o null si no hay datos
 */
export function getAverageWorkoutDuration(routineId?: string): number | null {
  const total = getTotalWorkoutDuration(routineId);
  if (!total) return null;

  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  // Filtrar por rutina si se especifica
  const filteredWorkouts = routineId
    ? workouts.filter((w: any) => w.routineId === routineId)
    : workouts;

  if (filteredWorkouts.length === 0) return null;

  return Math.round(total / filteredWorkouts.length);
}

/**
 * Calcula la duración promedio por ejercicio basándose en entrenamientos reales
 * @param routineId ID de la rutina (opcional). Si se proporciona, solo calcula para esa rutina
 * @returns Minutos promedio por ejercicio
 */
export function getAverageDurationPerExercise(routineId?: string): number {
  const avgTotal = getAverageWorkoutDuration(routineId);

  if (!avgTotal) {
    // Si no hay datos, usar estimación conservadora
    return 7; // ~7 minutos por ejercicio (4 series con descansos)
  }

  // Calcular promedio de ejercicios por entrenamiento
  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  // Filtrar por rutina si se especifica
  const filteredWorkouts = routineId
    ? workouts.filter((w: any) => w.routineId === routineId)
    : workouts;

  if (filteredWorkouts.length === 0) return 7;

  const totalExercises = filteredWorkouts.reduce((sum: number, w: any) => sum + (w.exercises?.length || 0), 0);
  const avgExercises = totalExercises / filteredWorkouts.length;

  if (avgExercises === 0) return 7;

  return Math.round(avgTotal / avgExercises);
}

/**
 * Estima la duración de una rutina basándose en:
 * 1. Duración promedio real de entrenamientos pasados de ESTA rutina específica (si hay datos)
 * 2. Cálculo basado en series y ejercicios (si no hay datos históricos de esta rutina)
 *
 * @param exerciseCount Número de ejercicios en la rutina
 * @param totalSets Número total de series
 * @param routineId ID de la rutina (opcional). Si se proporciona, usa solo datos de esa rutina
 * @returns Duración estimada en minutos
 */
export function estimateRoutineDuration(exerciseCount: number, totalSets: number = 0, routineId?: string): number {
  if (exerciseCount === 0) return 0;

  // Intentar obtener promedio de ESTA rutina específica
  const avgWorkoutDuration = getAverageWorkoutDuration(routineId);

  // Si hay datos históricos de esta rutina específica, usar ese promedio
  if (avgWorkoutDuration) {
    return avgWorkoutDuration;
  }

  // Si no hay datos de esta rutina, pero hay datos globales, usar promedio por ejercicio
  const globalAvgPerExercise = getAverageDurationPerExercise();
  if (getAverageWorkoutDuration()) {
    return Math.round(exerciseCount * globalAvgPerExercise);
  }

  // Si no hay datos históricos, calcular basándose en series
  if (totalSets > 0) {
    // Estimación: 45 seg por serie + 90 seg descanso + 30 seg transición
    const timePerSet = 0.75 + 1.5; // 2.25 minutos por serie
    const transitionTime = exerciseCount * 0.5; // 30 seg por ejercicio
    return Math.round((totalSets * timePerSet) + transitionTime);
  }

  // Fallback: estimación conservadora
  return exerciseCount * 7;
}
