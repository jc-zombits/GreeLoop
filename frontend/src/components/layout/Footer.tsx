import React from 'react';
import Link from 'next/link';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">GreenLoop</span>
            </div>
            <p className="text-gray-300 mb-4">
              Plataforma de intercambio sostenible que promueve la economía circular 
              y reduce el desperdicio a través del intercambio de objetos.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">
                <Phone className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">
                <MapPin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-green-400 transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/items" className="text-gray-300 hover:text-green-400 transition-colors">
                  Mis Items
                </Link>
              </li>
              <li>
                <Link href="/exchanges" className="text-gray-300 hover:text-green-400 transition-colors">
                  Intercambios
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-green-400 transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-green-400 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-green-400 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-green-400 transition-colors">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 GreenLoop. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};