// Sugerencias de progresión basadas en ciencia del entrenamiento
import { TrainingGoal } from '@/types';

interface WorkoutHistory {
  date: Date;
  maxWeight: number;
  avgReps: number;
  sets: number;
}

interface ProgressionSuggestion {
  type: 'weight' | 'reps' | 'sets' | 'maintain' | 'deload' | 'stagnant';
  message: string;
  suggestedWeight?: number;
  suggestedReps?: number;
  suggestedSets?: number;
  reasoning: string;
  icon: string;
  color: string;
}

/**
 * Genera sugerencias de progresión basadas en:
 * - Objetivo de entrenamiento (fuerza, hipertrofia, resistencia)
 * - Historial de entrenamientos
 * - Principios científicos de sobrecarga progresiva
 */
export function getProgressionSuggestion(
  history: WorkoutHistory[],
  currentWeight: number,
  currentReps: number,
  trainingGoal: TrainingGoal = 'hypertrophy'
): ProgressionSuggestion | null {
  if (history.length === 0) return null;

  const lastWorkout = history[0];
  const workoutsLast4Weeks = history.filter(h => {
    const daysDiff = (new Date().getTime() - h.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 28;
  });

  // Detectar estancamiento (mismo peso/reps por 3+ sesiones)
  if (workoutsLast4Weeks.length >= 3) {
    const lastThree = workoutsLast4Weeks.slice(0, 3);
    const sameWeight = lastThree.every(h => h.maxWeight === lastThree[0].maxWeight);
    const sameReps = lastThree.every(h => h.avgReps === lastThree[0].avgReps);

    if (sameWeight && sameReps) {
      return getDeloadOrProgressionSuggestion(lastWorkout, trainingGoal);
    }
  }

  // Detectar necesidad de deload (bajada de rendimiento)
  if (history.length >= 2) {
    const recent = history[0];
    const previous = history[1];

    if (recent.maxWeight < previous.maxWeight || recent.avgReps < previous.avgReps) {
      return {
        type: 'deload',
        message: 'Considera un deload',
        suggestedWeight: Math.round(lastWorkout.maxWeight * 0.7 * 2) / 2,
        suggestedReps: lastWorkout.avgReps,
        reasoning: 'Tu rendimiento ha bajado. Un deload (70% del peso) ayuda a recuperar y evitar sobreentrenamiento.',
        icon: '🔄',
        color: 'text-orange-500'
      };
    }
  }

  // Sugerencias basadas en objetivo
  return getSuggestionByGoal(lastWorkout, currentWeight, currentReps, trainingGoal);
}

function getDeloadOrProgressionSuggestion(
  lastWorkout: WorkoutHistory,
  trainingGoal: TrainingGoal
): ProgressionSuggestion {
  // Después de 3 semanas estancado, es momento de progresar
  const suggestions = {
    strength: {
      type: 'weight' as const,
      message: '¡Momento de aumentar peso!',
      suggestedWeight: lastWorkout.maxWeight + 2.5,
      suggestedReps: Math.max(1, lastWorkout.avgReps - 1), // Menos reps, más peso para fuerza
      reasoning: 'Para fuerza: aumenta 2.5kg y reduce reps. Rango óptimo: 1-6 reps con 85-100% 1RM.',
      icon: '💪',
      color: 'text-blue-500'
    },
    hypertrophy: {
      type: 'weight' as const,
      message: 'Aumenta el peso o las repeticiones',
      suggestedWeight: lastWorkout.maxWeight + 2.5,
      suggestedReps: lastWorkout.avgReps,
      reasoning: 'Para hipertrofia: aumenta peso manteniendo 6-12 reps, o añade 2 reps antes de subir peso.',
      icon: '🏋️',
      color: 'text-purple-500'
    },
    endurance: {
      type: 'reps' as const,
      message: 'Aumenta las repeticiones',
      suggestedWeight: lastWorkout.maxWeight,
      suggestedReps: lastWorkout.avgReps + 2,
      reasoning: 'Para resistencia: aumenta reps a 15+ o reduce tiempo de descanso (45-60 segundos).',
      icon: '⚡',
      color: 'text-green-500'
    }
  };

  return suggestions[trainingGoal];
}

function getSuggestionByGoal(
  lastWorkout: WorkoutHistory,
  currentWeight: number,
  currentReps: number,
  trainingGoal: TrainingGoal
): ProgressionSuggestion {
  switch (trainingGoal) {
    case 'strength':
      return getStrengthSuggestion(lastWorkout, currentWeight, currentReps);
    case 'hypertrophy':
      return getHypertrophySuggestion(lastWorkout, currentWeight, currentReps);
    case 'endurance':
      return getEnduranceSuggestion(lastWorkout, currentWeight, currentReps);
  }
}

function getStrengthSuggestion(
  lastWorkout: WorkoutHistory,
  currentWeight: number,
  currentReps: number
): ProgressionSuggestion {
  // Fuerza: 1-6 reps, 85-100% 1RM, 3-5 min descanso
  if (currentReps > 6) {
    return {
      type: 'weight',
      message: 'Aumenta el peso, reduce las reps',
      suggestedWeight: currentWeight + 5,
      suggestedReps: 5,
      reasoning: 'Para fuerza máxima, trabaja en rango de 1-6 reps con cargas pesadas (85-100% 1RM).',
      icon: '💪',
      color: 'text-blue-500'
    };
  }

  if (currentReps >= lastWorkout.avgReps && currentWeight >= lastWorkout.maxWeight) {
    return {
      type: 'weight',
      message: '¡Excelente! Aumenta 2.5-5kg',
      suggestedWeight: currentWeight + 2.5,
      suggestedReps: currentReps,
      reasoning: 'Has completado las reps objetivo. Aumenta peso progresivamente (2.5-5kg para fuerza).',
      icon: '🚀',
      color: 'text-emerald-500'
    };
  }

  return {
    type: 'maintain',
    message: 'Mantén este peso',
    suggestedWeight: currentWeight,
    suggestedReps: currentReps,
    reasoning: 'Consolida la fuerza en este peso antes de progresar. La técnica es clave.',
    icon: '✓',
    color: 'text-yellow-500'
  };
}

function getHypertrophySuggestion(
  lastWorkout: WorkoutHistory,
  currentWeight: number,
  currentReps: number
): ProgressionSuggestion {
  // Hipertrofia: 6-12 reps, 67-85% 1RM, 1-2 min descanso
  if (currentReps < 6) {
    return {
      type: 'reps',
      message: 'Reduce peso, aumenta reps',
      suggestedWeight: Math.round(currentWeight * 0.9 * 2) / 2,
      suggestedReps: 8,
      reasoning: 'Para hipertrofia óptima, trabaja en rango de 6-12 reps con 67-85% 1RM.',
      icon: '🏋️',
      color: 'text-purple-500'
    };
  }

  if (currentReps >= 12) {
    return {
      type: 'weight',
      message: 'Aumenta el peso',
      suggestedWeight: currentWeight + 2.5,
      suggestedReps: 8,
      reasoning: 'Superas 12 reps. Aumenta peso y vuelve a 8-10 reps para seguir estimulando hipertrofia.',
      icon: '📈',
      color: 'text-emerald-500'
    };
  }

  if (currentWeight >= lastWorkout.maxWeight && currentReps >= lastWorkout.avgReps) {
    return {
      type: 'weight',
      message: 'Progresión perfecta, sube peso',
      suggestedWeight: currentWeight + 2.5,
      suggestedReps: 8,
      reasoning: 'Excelente progresión. Aumenta 2.5kg y mantente en rango 8-10 reps.',
      icon: '🔥',
      color: 'text-emerald-500'
    };
  }

  return {
    type: 'reps',
    message: 'Añade 1-2 repeticiones',
    suggestedWeight: currentWeight,
    suggestedReps: currentReps + 2,
    reasoning: 'Progresa en reps antes de subir peso. Meta: 10-12 reps, luego aumenta peso.',
    icon: '➕',
    color: 'text-blue-500'
  };
}

function getEnduranceSuggestion(
  lastWorkout: WorkoutHistory,
  currentWeight: number,
  currentReps: number
): ProgressionSuggestion {
  // Resistencia: 15+ reps, 50-67% 1RM, 30-60 seg descanso
  if (currentReps < 15) {
    return {
      type: 'reps',
      message: 'Aumenta las repeticiones',
      suggestedWeight: currentWeight,
      suggestedReps: 15,
      reasoning: 'Para resistencia muscular, trabaja con 15+ reps y descansos cortos (30-60 seg).',
      icon: '⚡',
      color: 'text-green-500'
    };
  }

  if (currentReps >= 20) {
    return {
      type: 'weight',
      message: 'Aumenta peso ligeramente',
      suggestedWeight: currentWeight + 2.5,
      suggestedReps: 15,
      reasoning: 'Con 20+ reps, aumenta peso para mantener el desafío. Objetivo: 15-20 reps.',
      icon: '🎯',
      color: 'text-emerald-500'
    };
  }

  return {
    type: 'sets',
    message: 'Añade una serie o reduce descanso',
    suggestedWeight: currentWeight,
    suggestedReps: currentReps,
    suggestedSets: lastWorkout.sets + 1,
    reasoning: 'Progresa añadiendo series o reduciendo tiempo de descanso (30-45 segundos).',
    icon: '⏱️',
    color: 'text-blue-500'
  };
}

/**
 * Determina si el usuario está en un ciclo de estancamiento
 */
export function isStagnant(history: WorkoutHistory[]): boolean {
  if (history.length < 3) return false;

  const lastThree = history.slice(0, 3);
  const sameWeight = lastThree.every(h => h.maxWeight === lastThree[0].maxWeight);
  const sameReps = lastThree.every(h => h.avgReps === lastThree[0].avgReps);

  return sameWeight && sameReps;
}

/**
 * Calcula el tiempo óptimo de descanso según el objetivo
 */
export function getOptimalRestTime(trainingGoal: TrainingGoal): { min: number; max: number; description: string } {
  const restTimes = {
    strength: {
      min: 180,
      max: 300,
      description: '3-5 minutos para recuperación completa del sistema nervioso'
    },
    hypertrophy: {
      min: 60,
      max: 120,
      description: '1-2 minutos para balance entre estrés metabólico y recuperación'
    },
    endurance: {
      min: 30,
      max: 60,
      description: '30-60 segundos para maximizar adaptaciones metabólicas'
    }
  };

  return restTimes[trainingGoal];
}
