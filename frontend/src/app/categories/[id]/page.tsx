'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Grid, List, Package, Eye, MapPin, Home, Book, Gamepad2, Shirt, Car, Heart, Wrench, Music } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import Image from 'next/image';
import api from '@/lib/api';
import { Item, Category } from '@/types';

// Static categories for fallback/metadata
const STATIC_CATEGORIES = [
  {
    id: 1,
    name: 'Electrónicos',
    description: 'Dispositivos, gadgets y tecnología',
    icon: Package,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 2,
    name: 'Hogar y Jardín',
    description: 'Muebles, decoración y herramientas de jardín',
    icon: Home,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 3,
    name: 'Libros y Educación',
    description: 'Libros, material educativo y cursos',
    icon: Book,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 4,
    name: 'Deportes y Ocio',
    description: 'Equipamiento deportivo y entretenimiento',
    icon: Gamepad2,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 5,
    name: 'Ropa y Accesorios',
    description: 'Vestimenta, zapatos y complementos',
    icon: Shirt,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 6,
    name: 'Vehículos',
    description: 'Bicicletas, patinetes y accesorios',
    icon: Car,
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 7,
    name: 'Salud y Belleza',
    description: 'Productos de cuidado personal',
    icon: Heart,
    color: 'bg-rose-100 text-rose-600'
  },
  {
    id: 8,
    name: 'Herramientas',
    description: 'Herramientas de trabajo y bricolaje',
    icon: Wrench,
    color: 'bg-gray-100 text-gray-600'
  },
  {
    id: 9,
    name: 'Música e Instrumentos',
    description: 'Instrumentos musicales y equipos de audio',
    icon: Music,
    color: 'bg-indigo-100 text-indigo-600'
  }
];

// Helper to safely render icons if they are strings or components
const IconRenderer = ({ icon, className }: { icon: React.ComponentType<{ className?: string }> | string | undefined | null, className?: string }) => {
  if (!icon) return <Package className={className} />;
  
  if (typeof icon === 'string') {
    // If it's a URL or just a string, we might want to render it differently.
    // For now, assuming it might be an emoji or we fallback to Package
    return <span className={className}>{icon}</span>; 
  }
  
  const IconComponent = icon;
  return <IconComponent className={className} />;
};


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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Primero intentamos encontrar la categoría en los datos estáticos
        // Esto asegura que la página cargue incluso si la API no tiene metadatos de categoría aún
        const staticCategory = STATIC_CATEGORIES.find(cat => String(cat.id) === String(categoryId));
        
        // Si existe en estáticos, la usamos como base
        if (staticCategory) {
            // @ts-expect-error - Adapt static category to Category interface
            setCategory({
                ...staticCategory,
                itemCount: 0 // Will be updated if API returns data or counts
            });
        } else {
            // Si no está en estáticos, intentamos buscar en la API (caso fallback)
            try {
                const categories = await api.items.getCategories();
                const foundCategory = categories.find(cat => String(cat.id) === String(categoryId));
                if (foundCategory) {
                    setCategory(foundCategory);
                }
            } catch (err) {
                console.error('Error fetching categories from API:', err);
            }
        }

        // Siempre intentamos cargar los items, independientemente de dónde vino la categoría
        try {
            const response = await api.items.list({ category_id: categoryId });
            setItems(response.data || []);
        } catch (err) {
            console.error('Error fetching items:', err);
            setItems([]);
        }

      } catch (error) {
        console.error('Error in category page load:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
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
        return (b.estimatedValue || 0) - (a.estimatedValue || 0);
      case 'value-low':
        return (a.estimatedValue || 0) - (b.estimatedValue || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
          <p className="text-gray-600 mb-6">La categoría que buscas no existe o ha sido eliminada.</p>
          <Link href="/categories">
            <Button variant="primary">Volver a categorías</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryColor = 'bg-green-100 text-green-800'; // Default color since API doesn't return it

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
                <div className={`p-3 rounded-lg ${categoryColor} mr-4`}>
                    <IconRenderer icon={category.icon as React.ComponentType<{ className?: string }> | string} className="h-8 w-8" />
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
                <option value="Intercambiado">Intercambiado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
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
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {sortedItems.length} {sortedItems.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
        </div>

        {/* Items Grid/List */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intenta con otros términos de búsqueda o filtros.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {sortedItems.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200">
                        {item.images[0] ? (
                            <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status as keyof typeof statusColors]}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                            {item.condition}
                          </span>
                          <span className="font-bold text-green-600">
                            {item.estimatedValue} €
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {item.owner.location || 'Ubicación no disponible'}
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {item.views}
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex p-4">
                      <div className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                         {item.images[0] ? (
                            <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                      </div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <span className="font-bold text-green-600 text-lg">
                            {item.estimatedValue} €
                          </span>
                        </div>
                        <p className="mt-1 text-gray-600 line-clamp-2">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status as keyof typeof statusColors]}`}>
                              {item.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                              {item.condition}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 gap-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {item.owner.location}
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {item.views} views
                            </div>
                            <span className="text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
