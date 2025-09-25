'use client';

import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message
}) => {
  // Cerrar automáticamente después de 10 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start p-4 bg-red-50 rounded-md border border-red-200">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Se ha producido un error</h3>
            <p className="mt-2 text-sm text-red-700">{message}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;