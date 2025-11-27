'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Grid, List } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface Item {
  id: string;
  title: string;
  description?: string;
  category_name: string;
  condition: string;
  condition_display: string;
  city?: string;
  state?: string;
  primary_image_url?: string;
  owner_username: string;
  owner_rating: number;
  created_at: string;
  estimated_value?: number;
  view_count: number;
  interest_count: number;
}

const ExplorePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de búsqueda
        const params = new URLSearchParams({
          page: '1',
          page_size: '20',
          available_only: 'true'
        });
        
        if (searchQuery.trim()) {
          params.append('query', searchQuery.trim());
        }
        
        if (selectedCategory !== 'all') {
          // Aquí necesitaríamos el category_id, por ahora usamos el nombre
          // En una implementación completa, tendríamos un mapeo de nombres a IDs
        }
        
        const response = await fetch(`/api/v1/items/?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener items');
        }
        
        const data = await response.json();
        setItems(data.items || []);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchQuery, selectedCategory]);

  // Los filtros ahora se aplican en el servidor, así que mostramos todos los items recibidos
  const filteredItems = items;

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category_name)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explorar Items</h1>
          <p className="text-gray-600">Descubre items increíbles disponibles para intercambio</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Todas las categorías' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'items encontrados'}
          </p>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No se encontraron items que coincidan con tu búsqueda.</p>
            <p className="text-gray-400 mt-2">Intenta con otros términos de búsqueda o categorías.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-w-16 aspect-h-9">
                  <Image
                    src={item.primary_image_url || '/api/placeholder/300/200'}
                    alt={item.title}
                    width={640}
                    height={360}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description && item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description || 'Sin descripción'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {item.category_name}
                      </span>
                      <span className="text-gray-600">{item.condition_display}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {item.city && item.state ? `${item.city}, ${item.state}` : item.city || item.state || 'Ubicación no especificada'}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Por {item.owner_username}</span>
                      <span className="text-yellow-600">★ {item.owner_rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    {item.estimated_value && (
                      <div className="text-sm text-gray-600">
                        Valor estimado: €{item.estimated_value}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;