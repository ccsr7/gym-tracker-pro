'use client';

import { useEffect } from 'react';

/**
 * Hook que muestra una advertencia del navegador cuando el usuario intenta
 * cerrar la pestaña o navegar fuera de la página
 *
 * @param enabled - Si está habilitado el warning
 * @param message - Mensaje personalizado (algunos navegadores lo ignoran)
 */
export function useBeforeUnload(enabled: boolean, message?: string) {
  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevenir el cierre inmediato
      e.preventDefault();

      // Chrome requiere returnValue
      e.returnValue = message || '';

      // Algunos navegadores usan el valor de retorno
      return message || '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, message]);
}
