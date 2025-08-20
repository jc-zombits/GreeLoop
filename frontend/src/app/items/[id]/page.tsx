'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, Eye, Calendar, Edit, Trash2, MessageCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ItemDetail {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  status: string;
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

const statusColors = {
  'Disponible': 'bg-green-100 text-green-800',
  'En intercambio': 'bg-yellow-100 text-yellow-800',
  'Intercambiado': 'bg-gray-100 text-gray-800'
};

export default function ItemDetail() {
  const params = useParams();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setLoading(true);
        // Por ahora usamos datos de demostración
        // En el futuro, esto será una llamada real a la API
        const mockItem: ItemDetail = {
          id: parseInt(params.id as string),
          name: "Bicicleta de montaña Trek",
          description: "Bicicleta en excelente estado, poco uso. Ideal para senderos y montaña. Incluye casco y luces LED. Perfecta para aventuras al aire libre.",
          category: "Deportes",
          condition: "Muy bueno",
          status: "Disponible",
          views: 45,
          createdAt: "2024-01-15",
          owner: {
            id: 1,
            name: "Carlos Rodríguez",
            username: "carlos_bike",
            location: "Madrid, España",
            rating: 4.8
          },
          images: ["/api/placeholder/600/400"]
        };
        
        setItem(mockItem);
        // Simular verificación de propietario (en el futuro será con autenticación real)
        setIsOwner(false);
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando item...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Item no encontrado</h2>
          <p className="text-gray-600 mb-4">El item que buscas no existe o ha sido eliminado.</p>
          <Link href="/items">
            <Button>Volver a mis items</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/items" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis items
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
              <div className="flex items-center text-gray-700 mt-2">
                <Calendar className="h-4 w-4 mr-2" />
                Publicado el {new Date(item.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Link href={`/items/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-800 leading-relaxed">{item.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Item Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Item</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColors[item.status as keyof typeof statusColors]
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Categoría:</span>
                  <span className="font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Condición:</span>
                  <span className="font-medium text-gray-900">{item.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Vistas:</span>
                  <div className="flex items-center text-gray-900">
                    <Eye className="h-4 w-4 mr-1" />
                    {item.views}
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Propietario</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-700">Nombre:</span>
                  <span className="ml-2 font-medium text-gray-900">{item.owner.name}</span>
                </div>
                <div>
                  <span className="text-gray-700">Usuario:</span>
                  <span className="ml-2 font-medium text-gray-900">@{item.owner.username}</span>
                </div>
                {item.owner.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-gray-800">{item.owner.location}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-700">Calificación:</span>
                  <span className="ml-2 font-medium text-gray-900">{item.owner.rating}/5.0</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isOwner && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones</h3>
                <div className="space-y-4">
                  <Link href={`/messages/chat?userId=${item.owner.id}&exchangeId=${item.id}`} className="block">
                    <Button className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200">
                      <MessageCircle className="h-5 w-5 mr-3" />
                      Contactar vendedor
                    </Button>
                  </Link>
                  <Link href={`/exchanges/new?item_id=${item.id}&owner_id=${item.owner.id}`} className="block">
                    <Button variant="outline" className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-all duration-200">
                      <ArrowRightLeft className="h-5 w-5 mr-3" />
                      Proponer intercambio
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}