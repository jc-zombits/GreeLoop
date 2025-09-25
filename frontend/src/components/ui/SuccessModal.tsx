'use client';

import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Éxito',
  message
}) => {
  // Cerrar automáticamente después de 5 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
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
        <div className="flex items-start p-4 bg-green-50 rounded-md border border-green-200">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Operación exitosa</h3>
            <p className="mt-2 text-sm text-green-700">{message}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal;