// Utilidades para cálculo de volumen y estadísticas de entrenamiento

import { Workout } from '@/types';

export interface WeeklyVolume {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  totalVolume: number;
  workoutCount: number;
}

/**
 * Calcula el volumen total por semana
 */
export function getWeeklyVolumeStats(workouts: Workout[], weeksCount: number = 12): WeeklyVolume[] {
  const now = new Date();
  const weeks: WeeklyVolume[] = [];

  // Generar las últimas N semanas
  for (let i = 0; i < weeksCount; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // Filtrar workouts de esta semana
    const weekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });

    const totalVolume = weekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

    weeks.unshift({
      week: formatWeekLabel(weekStart),
      weekStart,
      weekEnd,
      totalVolume,
      workoutCount: weekWorkouts.length
    });
  }

  return weeks;
}

function formatWeekLabel(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month}`;
}

/**
 * Calcula récords personales (PR) por ejercicio
 */
export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  date: string;
}

export function getPersonalRecords(workouts: Workout[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();

  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map(s => s.weight));
      const maxReps = Math.max(...completedSets.map(s => s.reps));
      const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

      const existing = records.get(ex.exerciseId);

      if (!existing || maxWeight > existing.maxWeight) {
        records.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          maxWeight,
          maxReps,
          maxVolume: totalVolume,
          date: workout.date
        });
      }
    });
  });

  return records;
}

/**
 * Calcula frecuencia de entrenamiento (días por semana)
 */
export function getTrainingFrequency(workouts: Workout[], weeks: number = 4): number {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (weeks * 7));

  const recentWorkouts = workouts.filter(w => new Date(w.date) >= startDate);

  if (recentWorkouts.length === 0) return 0;

  return Number((recentWorkouts.length / weeks).toFixed(1));
}

/**
 * Calcula tiempo bajo tensión estimado
 */
export function getTimeUnderTension(workouts: Workout[]): number {
  let totalTUT = 0;

  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      completedSets.forEach(set => {
        // Estimación: 3 segundos por rep (2s concéntrico + 1s excéntrico)
        totalTUT += set.reps * 3;
      });
    });
  });

  return Math.round(totalTUT / 60); // Convertir a minutos
}
