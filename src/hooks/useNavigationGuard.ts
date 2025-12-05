'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook que previene la navegación interna de Next.js cuando hay cambios sin guardar
 *
 * @param enabled - Si está habilitada la protección
 * @param onNavigateAway - Callback que se llama cuando el usuario intenta navegar
 * @returns función para desactivar temporalmente la protección
 */
export function useNavigationGuard(
  enabled: boolean,
  onNavigateAway?: () => Promise<boolean>
) {
  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;
    if (!enabled || !onNavigateAway) return;

    // Interceptar navegación del navegador (botón atrás)
    const handlePopState = async (e: PopStateEvent) => {
      e.preventDefault();

      const shouldNavigate = await onNavigateAway();

      if (shouldNavigate) {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      } else {
        // Restaurar el estado actual
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Agregar un estado a la historia para poder detectar navegación atrás
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, onNavigateAway]);
}
