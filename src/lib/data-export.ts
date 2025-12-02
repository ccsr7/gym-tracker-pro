import { Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';

/**
 * Exporta los entrenamientos a formato CSV
 */
export function exportToCSV(workouts: Workout[]): string {
  const headers = [
    'Fecha',
    'Rutina',
    'Ejercicio',
    'Grupo Muscular',
    'Serie',
    'Reps',
    'Peso (kg)',
    'Volumen (kg)',
    'Completada',
    'Duración (min)',
    'RPE',
    'Notas Ejercicio',
    'Notas Generales'
  ];

  const rows = [headers.join(',')];

  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId);
      const exerciseName = exercise?.name || 'Unknown';
      const muscleGroup = exercise?.muscleGroup || 'Unknown';

      ex.sets.forEach((set, setIdx) => {
        const row = [
          new Date(workout.date).toLocaleDateString('es-ES'),
          `"${workout.routineName}"`,
          `"${exerciseName}"`,
          muscleGroup,
          setIdx + 1,
          set.reps,
          set.weight,
          set.completed ? set.reps * set.weight : 0,
          set.completed ? 'Sí' : 'No',
          workout.duration,
          workout.rpe || '',
          `"${ex.notes || ''}"`,
          `"${workout.notes || ''}"`
        ];
        rows.push(row.join(','));
      });
    });
  });

  return rows.join('\n');
}

/**
 * Exporta los entrenamientos a formato JSON estructurado
 */
export function exportToJSON(workouts: Workout[]): string {
  const exportData = workouts.map(workout => {
    return {
      fecha: new Date(workout.date).toISOString(),
      fechaLegible: new Date(workout.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      rutina: workout.routineName,
      duracion: workout.duration,
      rpe: workout.rpe,
      volumenTotal: workout.totalVolume,
      notas: workout.notes,
      ejercicios: workout.exercises.map(ex => {
        const exercise = getExerciseById(ex.exerciseId);
        return {
          nombre: exercise?.name || 'Unknown',
          categoria: exercise?.category || 'Unknown',
          grupoMuscular: exercise?.muscleGroup || 'Unknown',
          equipamiento: exercise?.equipment || 'Unknown',
          notas: ex.notes,
          series: ex.sets.map((set, idx) => ({
            serie: idx + 1,
            reps: set.reps,
            peso: set.weight,
            volumen: set.completed ? set.reps * set.weight : 0,
            completada: set.completed
          }))
        };
      })
    };
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * Descarga un archivo con el contenido especificado
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera un nombre de archivo con fecha actual
 */
export function generateFilename(format: 'csv' | 'json'): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `gym-tracker-${dateStr}.${format}`;
}
