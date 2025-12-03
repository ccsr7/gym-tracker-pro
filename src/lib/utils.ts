import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
}

export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  // Fórmula de Brzycki
  return Math.round(weight * (36 / (37 - reps)));
}

export function getSpanishDay(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

export function formatDate(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} De ${month} De ${year}`;
}

export function getDayColor(day: string): string {
  const colors: { [key: string]: string } = {
    'Lunes': 'bg-blue-500',
    'Martes': 'bg-purple-500',
    'Miércoles': 'bg-pink-500',
    'Jueves': 'bg-orange-500',
    'Viernes': 'bg-green-500',
    'Sábado': 'bg-cyan-500',
    'Domingo': 'bg-red-500',
  };
  return colors[day] || 'bg-gray-500';
}

export function getDayInitial(day: string): string {
  const initials: { [key: string]: string } = {
    'Lunes': 'L',
    'Martes': 'M',
    'Miércoles': 'M',
    'Jueves': 'J',
    'Viernes': 'V',
    'Sábado': 'S',
    'Domingo': 'D',
  };
  return initials[day] || '';
}

/**
 * Calcula la racha actual de entrenamientos consecutivos
 * La racha se rompe si se pierde un día de entrenamiento programado (no cuenta días de descanso)
 */
export function calculateWorkoutStreak(workouts: any[], routines: any[]): number {
  if (workouts.length === 0 || routines.length === 0) return 0;

  // Ordenar workouts por fecha descendente (más reciente primero)
  const sortedWorkouts = [...workouts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Obtener días de la semana con entrenamientos programados (no días de descanso)
  const workoutDays = routines
    .filter((r: any) => !r.isRestDay)
    .map((r: any) => r.day);

  if (workoutDays.length === 0) return 0;

  const daysOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Crear un mapa de días con entrenamientos programados
  const programmedDaysSet = new Set(workoutDays);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Crear un Set de fechas con entrenamientos completados (formato YYYY-MM-DD)
  const completedDates = new Set(
    sortedWorkouts.map((w: any) => {
      const date = new Date(w.date);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split('T')[0];
    })
  );

  // Iterar hacia atrás desde hoy hasta encontrar un día de entrenamiento perdido
  for (let i = 0; i < 365; i++) { // Límite de 365 días para evitar loops infinitos
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    const dayName = getSpanishDay(checkDate);
    const dateStr = checkDate.toISOString().split('T')[0];

    // Si es un día programado para entrenar
    if (programmedDaysSet.has(dayName)) {
      // Si hay un entrenamiento completado en esta fecha
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        // Si es hoy o en el futuro, no romper la racha aún
        if (checkDate.getTime() >= new Date().setHours(0, 0, 0, 0)) {
          continue;
        }
        // Si es en el pasado y no se completó, se rompe la racha
        break;
      }
    }
    // Si no es un día programado (día de descanso), continuar sin afectar la racha
  }

  return streak;
}
