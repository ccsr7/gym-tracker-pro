// Frases motivacionales para días de descanso
const MOTIVATIONAL_QUOTES = [
  "La recuperación es donde ocurre el verdadero progreso",
  "Tus músculos crecen cuando descansas, no cuando entrenas",
  "Un día de descanso bien aprovechado es un día ganado",
  "El descanso es parte del entrenamiento, no una pausa",
  "Los campeones descansan, los aficionados entrenan en exceso",
  "Tu cuerpo no se fortalece en el gym, se fortalece durante el descanso",
  "El descanso activo es tan importante como el entrenamiento activo",
  "No es pereza, es recuperación estratégica",
  "Los músculos se rompen en el gym, se reparan en el descanso",
  "Hoy descansas para mañana conquistar",
  "El sobreentrenamiento es el enemigo del progreso",
  "Escucha a tu cuerpo, el descanso es parte del plan",
  "La paciencia y el descanso son las claves del crecimiento",
  "Hoy recuperas, mañana superas tus límites",
  "El descanso es el mejor suplemento que existe",
  "Tu próximo PR comienza con un buen descanso hoy",
  "La disciplina incluye saber cuándo descansar",
  "El descanso es inversión, no pérdida de tiempo",
  "Respeta el proceso: entrena duro, descansa más duro",
  "Hoy recargas para mañana rendir al máximo"
];

// Consejos de recuperación para días de descanso
const RECOVERY_TIPS = [
  "Hidrátate: Bebe al menos 2-3 litros de agua hoy",
  "Prioriza el sueño: 7-9 horas ayudan a la recuperación muscular",
  "Nutrición: Consume proteínas para reparar tejido muscular",
  "Movilidad: 10-15 minutos de estiramientos suaves",
  "Foam roller: Libera tensión muscular con auto-masaje",
  "Camina 20-30 minutos para mantener la circulación activa",
  "Baño de contraste: Alterna agua fría y caliente para recuperación",
  "Medita 10 minutos: La recuperación mental es igual de importante",
  "Consume alimentos antiinflamatorios: Frutos rojos, pescado, nueces",
  "Evita el alcohol: Interfiere con la síntesis de proteínas",
  "Yoga suave: Mejora flexibilidad y reduce estrés muscular",
  "Masaje deportivo: Ayuda a eliminar toxinas y reduce DOMS",
  "Respiración profunda: Reduce cortisol y mejora recuperación",
  "Carbohidratos complejos: Reponen glucógeno muscular",
  "Suplementa con magnesio: Ayuda a la relajación muscular",
  "Toma una siesta: 20-30 minutos potencian la recuperación",
  "Baño caliente con sales de Epsom: Reduce inflamación",
  "Evita entrenamientos intensos: Deja que tu cuerpo se recupere",
  "Consume omega-3: Reducen inflamación y aceleran recuperación",
  "Escucha música relajante: Reduce el estrés y mejora el descanso"
];

export type RestDayContentType = 'motivation' | 'recovery';

export interface RestDayContent {
  type: RestDayContentType;
  content: string;
  icon: string;
}

/**
 * Obtiene contenido aleatorio para el día de descanso
 * Usa la fecha del día como seed para mantener el mismo contenido durante todo el día
 */
export function getDailyRestContent(): RestDayContent {
  const today = new Date().toDateString(); // "Mon Jan 01 2024"

  // Crear un hash simple de la fecha para usarlo como seed
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar el hash para determinar si mostrar motivación o consejo
  const useMotivation = Math.abs(hash) % 2 === 0;

  if (useMotivation) {
    const index = Math.abs(hash) % MOTIVATIONAL_QUOTES.length;
    return {
      type: 'motivation',
      content: MOTIVATIONAL_QUOTES[index],
      icon: '💪'
    };
  } else {
    const index = Math.abs(hash) % RECOVERY_TIPS.length;
    return {
      type: 'recovery',
      content: RECOVERY_TIPS[index],
      icon: '🧘'
    };
  }
}

/**
 * Obtiene una frase motivacional aleatoria
 */
export function getRandomMotivationalQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

/**
 * Obtiene un consejo de recuperación aleatorio
 */
export function getRandomRecoveryTip(): string {
  return RECOVERY_TIPS[Math.floor(Math.random() * RECOVERY_TIPS.length)];
}
