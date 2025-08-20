'use client';

import React, { useState } from 'react';
import { Search, Grid, List, Package, Home, Book, Gamepad2, Shirt, Car, Heart, Wrench, Music } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const categories = [
  {
    id: 1,
    name: 'Electrónicos',
    description: 'Dispositivos, gadgets y tecnología',
    icon: Package,
    itemCount: 156,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 2,
    name: 'Hogar y Jardín',
    description: 'Muebles, decoración y herramientas de jardín',
    icon: Home,
    itemCount: 243,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 3,
    name: 'Libros y Educación',
    description: 'Libros, material educativo y cursos',
    icon: Book,
    itemCount: 189,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 4,
    name: 'Deportes y Ocio',
    description: 'Equipamiento deportivo y entretenimiento',
    icon: Gamepad2,
    itemCount: 134,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 5,
    name: 'Ropa y Accesorios',
    description: 'Vestimenta, zapatos y complementos',
    icon: Shirt,
    itemCount: 298,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 6,
    name: 'Vehículos',
    description: 'Bicicletas, patinetes y accesorios',
    icon: Car,
    itemCount: 67,
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 7,
    name: 'Salud y Belleza',
    description: 'Productos de cuidado personal',
    icon: Heart,
    itemCount: 89,
    color: 'bg-rose-100 text-rose-600'
  },
  {
    id: 8,
    name: 'Herramientas',
    description: 'Herramientas de trabajo y bricolaje',
    icon: Wrench,
    itemCount: 112,
    color: 'bg-gray-100 text-gray-600'
  },
  {
    id: 9,
    name: 'Música e Instrumentos',
    description: 'Instrumentos musicales y equipos de audio',
    icon: Music,
    itemCount: 78,
    color: 'bg-indigo-100 text-indigo-600'
  }
];

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="mt-2 text-gray-600">
            Explora las diferentes categorías de items disponibles para intercambio.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/categories/${category.id}`}>
                  <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.itemCount} items</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Explorar
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link key={category.id} href={`/categories/${category.id}`}>
                    <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg ${category.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{category.itemCount} items</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Explorar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron categorías</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intenta con otros términos de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}