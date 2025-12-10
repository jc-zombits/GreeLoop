'use client';

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: ToastVariant;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  duration = 4000,
  variant = 'success',
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const Icon = variant === 'success' ? CheckCircle : variant === 'error' ? AlertCircle : Info;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-start gap-3 rounded-lg shadow-lg px-4 py-3 ${styles[variant]}`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-sm underline decoration-white/50 hover:decoration-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default Toast;
