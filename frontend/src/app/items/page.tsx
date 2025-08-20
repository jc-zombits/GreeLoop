'use client';

import React, { useState } from 'react';
import { Plus, Search, Grid, List, Eye, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useItems, useDeleteItem } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link';

// Datos estáticos removidos - ahora usamos el hook useItems

const statusColors = {
  'available': 'bg-green-100 text-green-800',
  'exchanging': 'bg-yellow-100 text-yellow-800',
  'exchanged': 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  'available': 'Disponible',
  'exchanging': 'En intercambio',
  'exchanged': 'Intercambiado'
};

export default function Items() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { user } = useAuth();
  const { data: items = [], isLoading, error } = useItems();
  const deleteItemMutation = useDeleteItem();

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este item?')) {
      try {
        await deleteItemMutation.mutateAsync(itemId);
      } catch (error) {
        console.error('Error al eliminar item:', error);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar items</h2>
          <p className="text-gray-600">Hubo un problema al cargar tus items. Por favor, intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Items</h1>
            <p className="mt-2 text-gray-600">
              Gestiona tus objetos disponibles para intercambio.
            </p>
          </div>
          <Link href="/items/new">
            <Button className="flex items-center gap-2 mt-4 sm:mt-0">
              <Plus className="h-5 w-5" />
              Publicar Item
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="En intercambio">En intercambio</option>
            <option value="Intercambiado">Intercambiado</option>
          </select>
          
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

        {/* Items Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg">
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
                      {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>{item.category_name || 'Sin categoría'}</span>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {item.views || 0}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/items/${item.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/items/${item.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
                            {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{item.category_name || 'Sin categoría'}</span>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {item.views || 0} vistas
                          </div>
                          <span>Publicado: {item.created_at}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/items/${item.id}`}>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/items/${item.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron items</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'Todos' 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Comienza publicando tu primer item para intercambio.'
              }
            </p>
            {!searchTerm && statusFilter === 'Todos' && (
              <div className="mt-6">
                <Link href="/items/new">
                  <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Publicar primer item
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}