'use client';

import Modal from './Modal';
import { AlertCircle, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const typeConfig = {
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/20',
      confirmButton: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-500/20',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/20',
      confirmButton: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/20',
      confirmButton: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-300 dark:text-slate-600 mb-6 text-sm">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 dark:bg-slate-200 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-white"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 ${config.confirmButton} text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 dark:focus:ring-offset-white`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
