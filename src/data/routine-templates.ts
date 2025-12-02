import { DayOfWeek, RoutineExercise } from '@/types';

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  icon: string;
  routines: {
    day: DayOfWeek;
    name: string;
    exercises: RoutineExercise[];
  }[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'ppl',
    name: 'Push/Pull/Legs',
    description: 'Rutina clásica dividiendo empuje, tirón y piernas. Ideal para intermedio/avanzado.',
    category: 'intermediate',
    daysPerWeek: 6,
    icon: '💪',
    routines: [
      {
        day: 'Lunes',
        name: 'Push (Empuje)',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10 },
          { exerciseId: 'shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'lateral-raises', sets: 3, reps: 12 },
          { exerciseId: 'tricep-dips', sets: 3, reps: 10 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Martes',
        name: 'Pull (Tirón)',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 6 },
          { exerciseId: 'pull-ups', sets: 3, reps: 8 },
          { exerciseId: 'barbell-row', sets: 3, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 10 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Miércoles',
        name: 'Legs (Piernas)',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12 },
          { exerciseId: 'calf-raise', sets: 4, reps: 15 }
        ]
      },
      {
        day: 'Jueves',
        name: 'Push (Empuje)',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10 },
          { exerciseId: 'shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'lateral-raises', sets: 3, reps: 12 },
          { exerciseId: 'tricep-dips', sets: 3, reps: 10 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Viernes',
        name: 'Pull (Tirón)',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 6 },
          { exerciseId: 'pull-ups', sets: 3, reps: 8 },
          { exerciseId: 'barbell-row', sets: 3, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 10 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Sábado',
        name: 'Legs (Piernas)',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12 },
          { exerciseId: 'calf-raise', sets: 4, reps: 15 }
        ]
      }
    ]
  },
  {
    id: 'full-body',
    name: 'Full Body 3 Días',
    description: 'Entrenamiento de cuerpo completo 3 veces por semana. Perfecto para principiantes.',
    category: 'beginner',
    daysPerWeek: 3,
    icon: '🏋️',
    routines: [
      {
        day: 'Lunes',
        name: 'Full Body A',
        exercises: [
          { exerciseId: 'squat', sets: 3, reps: 10 },
          { exerciseId: 'bench-press', sets: 3, reps: 10 },
          { exerciseId: 'barbell-row', sets: 3, reps: 10 },
          { exerciseId: 'shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'plank', sets: 3, reps: 60 }
        ]
      },
      {
        day: 'Miércoles',
        name: 'Full Body B',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, reps: 8 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10 },
          { exerciseId: 'pull-ups', sets: 3, reps: 8 },
          { exerciseId: 'lateral-raises', sets: 3, reps: 12 },
          { exerciseId: 'bicycle-crunches', sets: 3, reps: 20 }
        ]
      },
      {
        day: 'Viernes',
        name: 'Full Body C',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'russian-twists', sets: 3, reps: 30 }
        ]
      }
    ]
  },
  {
    id: 'upper-lower',
    name: 'Upper/Lower Split',
    description: 'Divide entre tren superior e inferior. Ideal para intermedio, 4 días/semana.',
    category: 'intermediate',
    daysPerWeek: 4,
    icon: '⚡',
    routines: [
      {
        day: 'Lunes',
        name: 'Upper (Superior) A',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8 },
          { exerciseId: 'shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'pull-ups', sets: 3, reps: 8 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 10 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Martes',
        name: 'Lower (Inferior) A',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'romanian-deadlift', sets: 3, reps: 10 },
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'calf-raise', sets: 4, reps: 15 }
        ]
      },
      {
        day: 'Jueves',
        name: 'Upper (Superior) B',
        exercises: [
          { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 4, reps: 10 },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'cable-row', sets: 3, reps: 12 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 10 },
          { exerciseId: 'tricep-dips', sets: 3, reps: 10 }
        ]
      },
      {
        day: 'Viernes',
        name: 'Lower (Inferior) B',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 6 },
          { exerciseId: 'bulgarian-split-squat', sets: 3, reps: 10 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12 },
          { exerciseId: 'seated-leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'seated-calf-raise', sets: 4, reps: 15 }
        ]
      }
    ]
  },
  {
    id: 'bro-split',
    name: 'Bro Split Clásico',
    description: 'Un grupo muscular por día, 5 días/semana. Popular entre culturistas.',
    category: 'intermediate',
    daysPerWeek: 5,
    icon: '🔥',
    routines: [
      {
        day: 'Lunes',
        name: 'Pecho',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8 },
          { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10 },
          { exerciseId: 'dumbbell-flyes', sets: 3, reps: 12 },
          { exerciseId: 'cable-crossover', sets: 3, reps: 12 },
          { exerciseId: 'push-ups', sets: 3, reps: 15 }
        ]
      },
      {
        day: 'Martes',
        name: 'Espalda',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 6 },
          { exerciseId: 'pull-ups', sets: 4, reps: 8 },
          { exerciseId: 'barbell-row', sets: 4, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'cable-row', sets: 3, reps: 12 }
        ]
      },
      {
        day: 'Miércoles',
        name: 'Hombros',
        exercises: [
          { exerciseId: 'shoulder-press', sets: 4, reps: 8 },
          { exerciseId: 'lateral-raises', sets: 4, reps: 12 },
          { exerciseId: 'front-raises', sets: 3, reps: 12 },
          { exerciseId: 'rear-delt-flyes', sets: 3, reps: 12 },
          { exerciseId: 'shrugs', sets: 3, reps: 15 }
        ]
      },
      {
        day: 'Jueves',
        name: 'Piernas',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'leg-press', sets: 4, reps: 12 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12 },
          { exerciseId: 'calf-raise', sets: 4, reps: 15 }
        ]
      },
      {
        day: 'Viernes',
        name: 'Brazos',
        exercises: [
          { exerciseId: 'barbell-curl', sets: 4, reps: 10 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 10 },
          { exerciseId: 'preacher-curl', sets: 3, reps: 12 },
          { exerciseId: 'tricep-dips', sets: 4, reps: 10 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 },
          { exerciseId: 'overhead-tricep-extension', sets: 3, reps: 12 }
        ]
      }
    ]
  },
  {
    id: 'starting-strength',
    name: 'Fuerza para Principiantes',
    description: 'Programa de fuerza simple y efectivo. 3 días/semana, enfocado en levantamientos básicos.',
    category: 'beginner',
    daysPerWeek: 3,
    icon: '💎',
    routines: [
      {
        day: 'Lunes',
        name: 'Día A',
        exercises: [
          { exerciseId: 'squat', sets: 5, reps: 5 },
          { exerciseId: 'bench-press', sets: 5, reps: 5 },
          { exerciseId: 'deadlift', sets: 1, reps: 5 }
        ]
      },
      {
        day: 'Miércoles',
        name: 'Día B',
        exercises: [
          { exerciseId: 'squat', sets: 5, reps: 5 },
          { exerciseId: 'shoulder-press', sets: 5, reps: 5 },
          { exerciseId: 'power-clean', sets: 5, reps: 3 }
        ]
      },
      {
        day: 'Viernes',
        name: 'Día A',
        exercises: [
          { exerciseId: 'squat', sets: 5, reps: 5 },
          { exerciseId: 'bench-press', sets: 5, reps: 5 },
          { exerciseId: 'deadlift', sets: 1, reps: 5 }
        ]
      }
    ]
  }
];

/**
 * Obtiene todas las plantillas
 */
export function getAllTemplates(): RoutineTemplate[] {
  return ROUTINE_TEMPLATES;
}

/**
 * Obtiene plantillas por categoría
 */
export function getTemplatesByCategory(category: 'beginner' | 'intermediate' | 'advanced'): RoutineTemplate[] {
  return ROUTINE_TEMPLATES.filter(t => t.category === category);
}

/**
 * Obtiene una plantilla por ID
 */
export function getTemplateById(id: string): RoutineTemplate | undefined {
  return ROUTINE_TEMPLATES.find(t => t.id === id);
}
