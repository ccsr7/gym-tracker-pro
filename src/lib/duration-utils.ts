// Utilidades para calcular duración de entrenamientos

/**
 * Calcula la duración promedio de todos los entrenamientos completados
 * @returns Duración promedio en minutos, o null si no hay datos
 */
export function getAverageWorkoutDuration(): number | null {
  if (typeof window === 'undefined') return null;

  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

  if (workouts.length === 0) return null;

  const totalDuration = workouts.reduce((sum: number, workout: any) => {
    return sum + (workout.duration || 0);
  }, 0);

  return Math.round(totalDuration / workouts.length);
}

/**
 * Calcula la duración promedio por ejercicio basándose en entrenamientos reales
 * @returns Minutos promedio por ejercicio
 */
export function getAverageDurationPerExercise(): number {
  const avgTotal = getAverageWorkoutDuration();

  if (!avgTotal) {
    // Si no hay datos, usar estimación conservadora
    return 7; // ~7 minutos por ejercicio (4 series con descansos)
  }

  // Calcular promedio de ejercicios por entrenamiento
  const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
  const avgExercises = workouts.reduce((sum: number, w: any) => sum + (w.exercises?.length || 0), 0) / workouts.length;

  if (avgExercises === 0) return 7;

  return Math.round(avgTotal / avgExercises);
}

/**
 * Estima la duración de una rutina basándose en:
 * 1. Duración promedio real de entrenamientos pasados (si hay datos)
 * 2. Cálculo basado en series y ejercicios (si no hay datos históricos)
 *
 * @param exerciseCount Número de ejercicios en la rutina
 * @param totalSets Número total de series
 * @returns Duración estimada en minutos
 */
export function estimateRoutineDuration(exerciseCount: number, totalSets: number = 0): number {
  if (exerciseCount === 0) return 0;

  const avgDurationPerExercise = getAverageDurationPerExercise();

  // Si hay datos históricos, usar promedio por ejercicio
  if (getAverageWorkoutDuration()) {
    return Math.round(exerciseCount * avgDurationPerExercise);
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
