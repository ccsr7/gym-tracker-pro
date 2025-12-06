'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ToastContainer from '@/components/ui/ToastContainer';
import { ToastProps, ToastType } from '@/components/ui/Toast';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastProps = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration,
      action: options.action,
      onClose: () => removeToast(id),
    };

    setToasts((prev) => [...prev, newToast]);
  }, [removeToast]);

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: 'success', duration });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: 'error', duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: 'warning', duration });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: 'info', duration });
    },
    [showToast]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
