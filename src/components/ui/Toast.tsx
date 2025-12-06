'use client';

import { useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function Toast({
  id,
  message,
  type,
  duration = 3000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-500',
      textColor: 'text-white',
      borderColor: 'border-emerald-600',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      borderColor: 'border-blue-600',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${config.bgColor} ${config.textColor} ${config.borderColor} border-2 rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md pointer-events-auto`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

        {/* Message */}
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium">{message}</p>
        </div>

        {/* Action Button */}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="px-3 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded transition-colors flex-shrink-0"
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Memoize to prevent re-renders when other toasts change
export default memo(Toast);
