'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Heart, Calendar, MapPin, Building2, Gift, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Contribution {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  quantity: number;
  estimated_value: number;
  currency: string;
  destination: string;
  delivery_method: 'pickup' | 'delivery' | 'both';
  delivery_address?: string;
  available_from: string;
  available_until?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  is_recurring: boolean;
  views_count: number;
  interested_count: number;
  created_at: string;
  updated_at: string;
}

interface ContributionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

// Datos de ejemplo (en producción vendrían de la API)
const mockContributions: Contribution[] = [];
const mockCategories: ContributionCategory[] = [
  { id: '1', name: 'Alimentos', description: 'Donaciones de comida', icon: '🍎', color: '#10B981', is_active: true },
  { id: '2', name: 'Ropa', description: 'Prendas de vestir', icon: '👕', color: '#3B82F6', is_active: true },
  { id: '3', name: 'Educación', description: 'Material educativo', icon: '📚', color: '#8B5CF6', is_active: true },
  { id: '4', name: 'Tecnología', description: 'Equipos tecnológicos', icon: '💻', color: '#F59E0B', is_active: true },
];

const statusLabels = {
  draft: 'Borrador',
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  expired: 'Expirada'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  expired: 'bg-red-100 text-red-800'
};

const deliveryMethodLabels = {
  pickup: 'Recoger en sitio',
  delivery: 'Entrega a domicilio',
  both: 'Ambas opciones'
};

export default function ContributionsPage() {
  const { user, userType, loading } = useAuth();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>(mockContributions);
  const [categories, setCategories] = useState<ContributionCategory[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || userType !== 'company') {
        router.push('/auth');
        return;
      }
      setIsLoading(false);
      // Aquí cargarías las contribuciones reales de la API
      // loadContributions();
    }
  }, [user, userType, loading, router]);

  const filteredContributions = contributions.filter(contribution => {
    const matchesSearch = contribution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contribution.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || contribution.category.id === selectedCategory;
    const matchesStatus = !selectedStatus || contribution.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteContribution = (contributionId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta contribución?')) {
      setContributions(prev => prev.filter(c => c.id !== contributionId));
      // Aquí harías la llamada a la API para eliminar
      // deleteContribution(contributionId);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contribuciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="h-8 w-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Mis Contribuciones</h1>
              </div>
              <p className="text-gray-600">
                Gestiona tus donaciones y contribuciones sociales
              </p>
            </div>
            <Link href="/contributions/new">
              <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-5 w-5" />
                Nueva Contribución
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar contribuciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Más filtros
            </Button>
          </div>
        </div>

        {/* Contributions List */}
        {filteredContributions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContributions.map((contribution) => (
              <div key={contribution.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: contribution.category.color }}
                      >
                        {contribution.category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{contribution.title}</h3>
                        <p className="text-sm text-gray-500">{contribution.category.name}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[contribution.status]}`}>
                      {statusLabels[contribution.status]}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{contribution.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Gift className="h-4 w-4 mr-2" />
                      Cantidad: {contribution.quantity}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {deliveryMethodLabels[contribution.delivery_method]}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Disponible desde: {new Date(contribution.available_from).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {contribution.views_count}
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {contribution.interested_count}
                      </div>
                    </div>
                    {contribution.is_recurring && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Recurrente
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/contributions/${contribution.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver detalles
                      </Button>
                    </Link>
                    <Link href={`/contributions/${contribution.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteContribution(contribution.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory || selectedStatus 
                ? 'No se encontraron contribuciones' 
                : 'No tienes contribuciones aún'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory || selectedStatus
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera contribución para ayudar a la comunidad'
              }
            </p>
            {!searchTerm && !selectedCategory && !selectedStatus && (
              <Link href="/contributions/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Contribución
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}