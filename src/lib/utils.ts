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
