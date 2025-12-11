/**
 * Mapeo de IDs de ejercicios en inglés (plantillas) a español (base de datos)
 *
 * Las plantillas de rutinas usan IDs en inglés, pero los ejercicios reales
 * tienen IDs en español. Este archivo mapea entre ambos.
 */

export const EXERCISE_ID_MAP: Record<string, string> = {
  // Pecho
  'bench-press': 'press-banca-plano',
  'incline-dumbbell-press': 'press-inclinado-mancuernas',
  'dumbbell-bench-press': 'press-plano-libre',
  'dumbbell-flyes': 'aperturas-mancuernas',
  'cable-crossover': 'aperturas-mancuernas', // Fallback a aperturas
  'push-ups': 'flexiones',

  // Espalda
  'deadlift': 'peso-muerto',
  'pull-ups': 'dominadas',
  'barbell-row': 'remo-barra',
  'lat-pulldown': 'jalones',
  'cable-row': 'remo-polea-sentado',
  'romanian-deadlift': 'peso-muerto-rumano',

  // Hombros
  'shoulder-press': 'press-militar',
  'dumbbell-shoulder-press': 'press-mancuernas-sentado',
  'lateral-raises': 'elevaciones-laterales',
  'front-raises': 'elevaciones-frontales',
  'rear-delt-flyes': 'pajaros',
  'shrugs': 'encogimientos-barra',

  // Piernas
  'squat': 'sentadilla-barra',
  'leg-press': 'prensa',
  'leg-curl': 'femoral-tumbado',
  'leg-extension': 'extension-cuadriceps',
  'calf-raise': 'gemelos-pie',
  'bulgarian-split-squat': 'sentadilla-bulgara',
  'seated-leg-curl': 'femoral-sentado',
  'seated-calf-raise': 'gemelos-sentado',

  // Brazos
  'barbell-curl': 'curl-barra',
  'hammer-curl': 'curl-martillo',
  'preacher-curl': 'curl-predicador',
  'tricep-dips': 'fondos-paralelas',
  'tricep-pushdown': 'pushdown-cuerda',
  'overhead-tricep-extension': 'extension-copa',

  // Core
  'plank': 'plancha',
  'bicycle-crunches': 'abdominales-bicicleta',
  'russian-twists': 'russian-twist',

  // Ejercicios que no existen - usar fallbacks
  'power-clean': 'peso-muerto', // No existe, usar peso muerto
};

/**
 * Convierte un ID de ejercicio de inglés a español
 * Si no encuentra el mapeo, devuelve el ID original
 */
export function mapExerciseId(englishId: string): string {
  return EXERCISE_ID_MAP[englishId] || englishId;
}

/**
 * Convierte un array de ejercicios con IDs en inglés a español
 */
export function mapExerciseIds<T extends { exerciseId: string }>(exercises: T[]): T[] {
  return exercises.map(ex => ({
    ...ex,
    exerciseId: mapExerciseId(ex.exerciseId)
  }));
}
