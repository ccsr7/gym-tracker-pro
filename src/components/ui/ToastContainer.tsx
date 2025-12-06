'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 3).map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => onClose(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
