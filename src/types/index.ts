export interface User {
  name: string;
  email: string;
  weight?: number;
  height?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  image: string;
  isFavorite?: boolean;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

// Para rutinas (plantilla)
export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  isSupersetWith?: string; // ID del ejercicio con el que forma biserie
}

// Para workouts activos (con peso registrado)
export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  isSupersetWith?: string; // ID del ejercicio con el que forma biserie
  notes?: string; // Notas específicas de este ejercicio en este entrenamiento
}

export interface Routine {
  id: string;
  name: string;
  day: DayOfWeek;
  exercises: RoutineExercise[];
  duration: number;
  isRestDay?: boolean; // Indica si este día es de descanso programado
}

export interface Workout {
  id: string;
  date: string;
  routineId: string;
  routineName: string;
  exercises: WorkoutExercise[];
  duration: number;
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  totalVolume?: number; // Peso total levantado (kg)
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
