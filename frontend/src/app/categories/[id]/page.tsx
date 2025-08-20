'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Grid, List, Package, Eye, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

interface Item {
  id: number;
  name: string;
  description: string;
  condition: string;
  status: string;
  estimatedValue: number;
  views: number;
  createdAt: string;
  owner: {
    id: number;
    name: string;
    username: string;
    location?: string;
    rating: number;
  };
  images: string[];
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  itemCount: number;
}

// Las categorías se cargarán desde la API
const mockCategories: Category[] = [];

// Los items se cargarán desde la API
const mockItems: Item[] = [];

const statusColors = {
  'Disponible': 'bg-green-100 text-green-800',
  'En intercambio': 'bg-yellow-100 text-yellow-800',
  'Intercambiado': 'bg-gray-100 text-gray-800'
};

const conditionColors = {
  'Nuevo': 'bg-green-100 text-green-800',
  'Como nuevo': 'bg-blue-100 text-blue-800',
  'Muy bueno': 'bg-purple-100 text-purple-800',
  'Bueno': 'bg-orange-100 text-orange-800',
  'Aceptable': 'bg-red-100 text-red-800'
};

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = parseInt(params.id as string);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Simular carga de datos de la categoría
    const foundCategory = mockCategories.find(cat => cat.id === categoryId);
    if (foundCategory) {
      setCategory(foundCategory);
      // Filtrar items por categoría (en este caso, todos los items mock son de electrónicos)
      if (categoryId === 1) {
        setItems(mockItems);
      } else {
        // Para otras categorías, mostrar algunos items de ejemplo
        setItems(mockItems.slice(0, 3));
      }
    }
  }, [categoryId]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCondition && matchesStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.views - a.views;
      case 'value-high':
        return b.estimatedValue - a.estimatedValue;
      case 'value-low':
        return a.estimatedValue - b.estimatedValue;
      default:
        return 0;
    }
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
          <Link href="/categories">
            <Button variant="primary">Volver a categorías</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${category.color} mr-4`}>
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                  <p className="text-gray-600 mt-1">{category.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{category.itemCount} productos disponibles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="recent">Más recientes</option>
                <option value="popular">Más populares</option>
                <option value="value-high">Valor: Mayor a menor</option>
                <option value="value-low">Valor: Menor a mayor</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="all">Todas las condiciones</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Como nuevo">Como nuevo</option>
                <option value="Muy bueno">Muy bueno</option>
                <option value="Bueno">Bueno</option>
                <option value="Aceptable">Aceptable</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="all">Todos los estados</option>
                <option value="Disponible">Disponible</option>
                <option value="En intercambio">En intercambio</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {sortedItems.length} de {items.length} productos
            </p>
            <div className="flex space-x-2">
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
        </div>

        {/* Items Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg">
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                        {item.condition}
                      </span>
                      <span className="text-lg font-bold text-green-600">€{item.estimatedValue}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.owner.location}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {item.views}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {sortedItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                            <span className="text-lg font-bold text-green-600">€{item.estimatedValue}</span>
                          </div>
                          <p className="text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                              {item.condition}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
                              {item.status}
                            </span>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {item.owner.location}
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {item.views}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || conditionFilter !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay productos en esta categoría'}
            </p>
            <Link href="/items/new">
              <Button variant="primary">Publicar primer producto</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}