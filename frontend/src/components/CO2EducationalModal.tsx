'use client';

import React from 'react';
import { Leaf, Globe, Factory, TreePine, Recycle, TrendingDown } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface CO2EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  co2Amount: string;
}

export const CO2EducationalModal: React.FC<CO2EducationalModalProps> = ({
  isOpen,
  onClose,
  co2Amount
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💚 Tu Impacto Ambiental Positivo"
      size="lg"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center bg-green-50 rounded-lg p-6">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {co2Amount}
          </div>
          <p className="text-lg text-gray-700 font-medium">
            de CO₂ ahorrado gracias a tus intercambios
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ¡Estás haciendo una diferencia real por el planeta! 🌍
          </p>
        </div>

        {/* What is CO2 Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Globe className="h-6 w-6 text-blue-600 mr-2" />
            ¿Qué es el CO₂?
          </h3>
          <p className="text-gray-700 leading-relaxed">
            El dióxido de carbono (CO₂) es uno de los principales gases de efecto invernadero. 
            Se produce cuando quemamos combustibles fósiles, fabricamos productos nuevos y 
            transportamos mercancías. Cada objeto que reutilizas en lugar de comprar nuevo 
            evita estas emisiones.
          </p>
        </div>

        {/* Why it matters */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Leaf className="h-6 w-6 text-green-600 mr-2" />
            ¿Por qué es importante reducir el CO₂?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingDown className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Cambio Climático</span>
              </div>
              <p className="text-sm text-blue-800">
                Reducir CO₂ ayuda a frenar el calentamiento global y protege nuestro clima.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TreePine className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Ecosistemas</span>
              </div>
              <p className="text-sm text-green-800">
                Protege bosques, océanos y la biodiversidad de nuestro planeta.
              </p>
            </div>
          </div>
        </div>

        {/* Your Impact */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Recycle className="h-6 w-6 text-purple-600 mr-2" />
            Tu impacto con GreenLoop
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Factory className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Menos Producción</p>
                <p className="text-xs text-gray-600">Reduces la demanda de productos nuevos</p>
              </div>
              <div>
                <Recycle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Más Reutilización</p>
                <p className="text-xs text-gray-600">Extiendes la vida útil de los objetos</p>
              </div>
              <div>
                <Leaf className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Menor Huella</p>
                <p className="text-xs text-gray-600">Reduces tu huella de carbono personal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">💡 ¿Sabías que...?</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Un smartphone nuevo genera ~70kg de CO₂ en su fabricación</li>
            <li>• Una camiseta de algodón produce ~8kg de CO₂</li>
            <li>• Reutilizar evita el 80% de las emisiones de un producto nuevo</li>
            <li>• {co2Amount} equivale a plantar {Math.round(parseFloat(co2Amount.replace('kg', '')) / 22)} árboles 🌳</li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center pt-4">
          <p className="text-gray-700 mb-4">
            ¡Sigue intercambiando y construyamos juntos un futuro más sostenible!
          </p>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            ¡Continuar ayudando al planeta! 🌱
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CO2EducationalModal;