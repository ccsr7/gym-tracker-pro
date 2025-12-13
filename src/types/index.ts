export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance';

export interface User {
  name: string;
  email: string;
  weight?: number;
  height?: number;
  trainingGoal?: TrainingGoal;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  image: string;
  isFavorite?: boolean;
  // Nuevos campos para mejorar la biblioteca
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
  instructions?: string[];  // Pasos para ejecutar el ejercicio
  formTips?: string[];      // Tips de forma correcta
  primaryMuscles?: string[];   // Músculos principales trabajados
  secondaryMuscles?: string[]; // Músculos secundarios
  variations?: string[];    // IDs de ejercicios que son variaciones
  videoUrl?: string;        // URL de video demostrativo (futuro)
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

export type RestDayReason =
  | 'gym-closed'      // Gimnasio cerrado (feriado, mantenimiento)
  | 'active-rest'     // Descanso activo planificado
  | 'injury'          // Lesión o molestia
  | 'personal'        // Motivos personales
  | 'deload'          // Semana de descarga
  | 'other';          // Otro motivo

export interface RestDay {
  id: string;
  date: string;           // ISO string de la fecha
  reason: RestDayReason;
  notes?: string;         // Notas adicionales
  createdAt: string;      // Timestamp de creación
}
