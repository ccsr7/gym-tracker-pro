import { Workout } from '@/types';
import { storageService, STORAGE_KEYS } from './storage-service';
import { getSpanishDay } from './utils';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'workouts' | 'volume' | 'streak' | 'pr' | 'consistency';
  requirement: number;
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
}

/**
 * Define todos los logros disponibles en la aplicación
 */
export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedDate'>[] = [
  // Workouts
  {
    id: 'first-workout',
    title: 'Primer Paso',
    description: 'Completa tu primer entrenamiento',
    icon: '🎯',
    category: 'workouts',
    requirement: 1,
    color: 'text-blue-500'
  },
  {
    id: 'workout-10',
    title: 'Constancia',
    description: 'Completa 10 entrenamientos',
    icon: '💪',
    category: 'workouts',
    requirement: 10,
    color: 'text-emerald-500'
  },
  {
    id: 'workout-25',
    title: 'Dedicación',
    description: 'Completa 25 entrenamientos',
    icon: '🔥',
    category: 'workouts',
    requirement: 25,
    color: 'text-orange-500'
  },
  {
    id: 'workout-50',
    title: 'Veterano',
    description: 'Completa 50 entrenamientos',
    icon: '⭐',
    category: 'workouts',
    requirement: 50,
    color: 'text-yellow-500'
  },
  {
    id: 'workout-100',
    title: 'Centurión',
    description: 'Completa 100 entrenamientos',
    icon: '👑',
    category: 'workouts',
    requirement: 100,
    color: 'text-purple-500'
  },

  // Volume
  {
    id: 'volume-10k',
    title: 'Levantador',
    description: 'Levanta 10,000 kg totales',
    icon: '🏋️',
    category: 'volume',
    requirement: 10000,
    color: 'text-blue-500'
  },
  {
    id: 'volume-50k',
    title: 'Peso Pesado',
    description: 'Levanta 50,000 kg totales',
    icon: '💎',
    category: 'volume',
    requirement: 50000,
    color: 'text-cyan-500'
  },
  {
    id: 'volume-100k',
    title: 'Máquina de Guerra',
    description: 'Levanta 100,000 kg totales',
    icon: '🚀',
    category: 'volume',
    requirement: 100000,
    color: 'text-indigo-500'
  },

  // Streak
  {
    id: 'streak-7',
    title: 'Semana Perfecta',
    description: 'Entrena 7 días seguidos',
    icon: '📅',
    category: 'streak',
    requirement: 7,
    color: 'text-green-500'
  },
  {
    id: 'streak-30',
    title: 'Mes Imparable',
    description: 'Entrena 30 días seguidos',
    icon: '🔥',
    category: 'streak',
    requirement: 30,
    color: 'text-red-500'
  },

  // Consistency
  {
    id: 'consistency-4weeks',
    title: 'Consistencia',
    description: 'Entrena 3+ veces por semana durante 4 semanas',
    icon: '📊',
    category: 'consistency',
    requirement: 4,
    color: 'text-teal-500'
  },
  {
    id: 'consistency-12weeks',
    title: 'Disciplina',
    description: 'Entrena 3+ veces por semana durante 12 semanas',
    icon: '🎖️',
    category: 'consistency',
    requirement: 12,
    color: 'text-amber-500'
  },

  // PR
  {
    id: 'pr-first',
    title: 'Nuevo Récord',
    description: 'Establece tu primer récord personal',
    icon: '🏆',
    category: 'pr',
    requirement: 1,
    color: 'text-yellow-500'
  },
  {
    id: 'pr-10',
    title: 'Coleccionista',
    description: 'Establece 10 récords personales',
    icon: '🌟',
    category: 'pr',
    requirement: 10,
    color: 'text-amber-500'
  }
];

/**
 * Calcula el progreso de cada logro basado en los entrenamientos
 */
export function calculateAchievements(workouts: Workout[]): Achievement[] {
  // Cargar logros desbloqueados usando StorageService
  const unlockedAchievements = storageService.get<Record<string, string>>(STORAGE_KEYS.ACHIEVEMENTS, {});

  return ACHIEVEMENTS.map(achievement => {
    const unlocked = unlockedAchievements[achievement.id];

    let progress = 0;

    switch (achievement.category) {
      case 'workouts':
        progress = workouts.length;
        break;

      case 'volume':
        progress = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        break;

      case 'streak':
        progress = calculateCurrentStreak(workouts);
        break;

      case 'consistency':
        progress = calculateConsistencyWeeks(workouts);
        break;

      case 'pr':
        progress = calculatePRCount(workouts);
        break;
    }

    const isUnlocked = progress >= achievement.requirement;

    // Si el logro se acaba de desbloquear, guardarlo
    if (isUnlocked && !unlocked) {
      unlockedAchievements[achievement.id] = new Date().toISOString();
      storageService.set(STORAGE_KEYS.ACHIEVEMENTS, unlockedAchievements);
    }

    return {
      ...achievement,
      unlocked: isUnlocked,
      unlockedDate: unlocked || (isUnlocked ? new Date().toISOString() : undefined)
    };
  });
}

/**
 * Calcula la racha actual de entrenamientos consecutivos
 * Incluye días de descanso planificados como días válidos
 */
function calculateCurrentStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  // Cargar días de descanso planificados
  const restDays = storageService.get<any[]>(STORAGE_KEYS.REST_DAYS, []);
  const restDatesSet = new Set(
    restDays.map(rd => new Date(rd.date).toISOString().split('T')[0])
  );

  // Cargar rutinas para identificar días de descanso programados
  const routines = storageService.get<any[]>(STORAGE_KEYS.ROUTINES, []);
  const routineRestDays = routines
    .filter((r: any) => r.isRestDay === true && !r.isTemplate && r.day)
    .map((r: any) => r.day);
  const routineRestDaysSet = new Set(routineRestDays);

  const sortedWorkouts = [...workouts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 1;
  let currentDate = new Date(sortedWorkouts[0].date);

  for (let i = 1; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].date);
    const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      streak++;
      currentDate = workoutDate;
    } else if (daysDiff > 1) {
      // Check if the gap days are rest days
      let allRestDays = true;
      for (let d = 1; d < daysDiff; d++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - d);
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayName = getSpanishDay(checkDate);

        // Verificar si es descanso manual O descanso programado en rutina
        if (!restDatesSet.has(dateStr) && !routineRestDaysSet.has(dayName)) {
          allRestDays = false;
          break;
        }
      }

      if (allRestDays) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
  }

  return streak;
}

/**
 * Calcula cuántas semanas consecutivas se ha entrenado 3+ veces
 */
function calculateConsistencyWeeks(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  const now = new Date();
  let consistentWeeks = 0;

  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (weekOffset * 7));
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });

    if (weekWorkouts.length >= 3) {
      consistentWeeks++;
    } else {
      break; // Rompe la racha
    }
  }

  return consistentWeeks;
}

/**
 * Cuenta cuántos récords personales se han establecido
 */
function calculatePRCount(workouts: Workout[]): number {
  const prMap = new Map<string, number>();

  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map(s => s.weight));
      const currentPR = prMap.get(ex.exerciseId) || 0;

      if (maxWeight > currentPR) {
        prMap.set(ex.exerciseId, maxWeight);
      }
    });
  });

  return prMap.size;
}

/**
 * Obtiene los logros recién desbloqueados (últimas 24 horas)
 */
export function getRecentlyUnlockedAchievements(achievements: Achievement[]): Achievement[] {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return achievements.filter(a => {
    if (!a.unlocked || !a.unlockedDate) return false;
    return new Date(a.unlockedDate) > oneDayAgo;
  });
}

/**
 * Obtiene estadísticas generales de logros
 */
export function getAchievementStats(achievements: Achievement[]) {
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  const percentage = Math.round((unlocked / total) * 100);

  return {
    total,
    unlocked,
    locked: total - unlocked,
    percentage
  };
}
