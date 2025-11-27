'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, MessageSquare, Package } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { ExchangeData } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  estimatedValue?: number;
  location: string;
  images: string[];
  ownerId: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
}

interface TargetItem {
  id: string;
  title: string;
  owner: {
    id: string;
    username: string;
    reputation_score: number;
    city?: string;
    state?: string;
  };
}

const statusColors = {
  'Disponible': 'bg-green-100 text-green-800',
  'En intercambio': 'bg-yellow-100 text-yellow-800',
  'Intercambiado': 'bg-gray-100 text-gray-800'
};

const conditionColors = {
  'Nuevo': 'bg-blue-100 text-blue-800',
  'Muy bueno': 'bg-green-100 text-green-800',
  'Bueno': 'bg-yellow-100 text-yellow-800',
  'Regular': 'bg-orange-100 text-orange-800',
  'Para reparar': 'bg-red-100 text-red-800'
};

export default function NewExchangePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [targetItem, setTargetItem] = useState<TargetItem | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  // Obtener parámetros de la URL
  const targetItemId = searchParams.get('item_id');
  const targetOwnerId = searchParams.get('owner_id');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Obtener el item objetivo desde la URL
         if (targetItemId) {
           // Obtener detalles del item objetivo
           const targetItemResponse = await api.items.get(targetItemId);
           
           // Obtener información del propietario
           const ownerResponse = await api.users.getById(targetItemResponse.ownerId);
           
           setTargetItem({
             id: targetItemResponse.id,
             title: targetItemResponse.name,
             owner: {
               id: ownerResponse.id,
               username: ownerResponse.username,
               reputation_score: ownerResponse.reputation_score,
               city: ownerResponse.city,
               state: ownerResponse.state
             }
           });
         }
        
        // Obtener mis items disponibles para intercambio
        const myItemsResponse = await api.users.getMyItems({ status: 'active' });
        setMyItems(myItemsResponse.data || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        // En caso de error, usar datos mock como fallback
        if (targetItemId) {
          const mockTargetItem: TargetItem = {
            id: targetItemId,
            title: "Bicicleta de montaña Trek",
            owner: {
              id: "mock-owner-id",
              username: "carlos_bike",
              reputation_score: 4.5,
              city: "Barcelona",
              state: "Cataluña"
            }
          };
          setTargetItem(mockTargetItem);
        }

        const mockMyItems: Item[] = [
          {
            id: "1",
            name: "Guitarra acústica Yamaha",
            description: "Guitarra en excelente estado, ideal para principiantes y músicos intermedios.",
            category: "Música",
            condition: "Muy bueno",
            estimatedValue: 250,
            location: "Madrid, España",
            images: ["/api/placeholder/300/200"],
            ownerId: "current-user-id",
            status: "Disponible",
            tags: ["guitarra", "música", "yamaha"],
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            views: 25,
            likes: 8
          },
          {
            id: "2",
            name: "Cámara Canon EOS",
            description: "Cámara profesional con lentes incluidos.",
            category: "Electrónicos",
            condition: "Bueno",
            estimatedValue: 800,
            location: "Madrid, España",
            images: ["/api/placeholder/300/200"],
            ownerId: "current-user-id",
            status: "Disponible",
            tags: ["cámara", "fotografía", "canon"],
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            views: 35,
            likes: 12
          },
          {
            id: "3",
            name: "Libro de programación",
            description: "Colección de libros técnicos sobre desarrollo web.",
            category: "Libros",
            condition: "Muy bueno",
            estimatedValue: 50,
            location: "Madrid, España",
            images: ["/api/placeholder/300/200"],
            ownerId: "current-user-id",
            status: "Disponible",
            tags: ["libros", "programación", "desarrollo"],
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            views: 15,
            likes: 5
          }
        ];
        
        setMyItems(mockMyItems);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [targetItemId, targetOwnerId]);

  const filteredItems = myItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    const isAvailable = item.status === 'Disponible';
    
    return matchesSearch && matchesCategory && matchesCondition && isAvailable;
  });

  const handleProposeExchange = async () => {
    if (!selectedItem) {
      alert('Por favor selecciona un ítem para intercambiar');
      return;
    }

    if (!targetItem) {
      alert('Error: No se encontró el ítem objetivo');
      return;
    }

    setLoading(true);
    
    try {
      const exchangeData: ExchangeData = {
        offered_item_id: parseInt(selectedItem.id),
        requested_item_id: parseInt(targetItem.id),
        message: message.trim() || undefined
      };

      await api.exchanges.create(exchangeData);
      
      alert('¡Propuesta de intercambio enviada exitosamente!');
      
      router.push('/exchanges');
      
    } catch (error: unknown) {
      console.error('Error creating exchange:', error);
      
      let errorMessage = 'Error al enviar la propuesta de intercambio';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando items...</p>
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
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Proponer Intercambio</h1>
          {targetItem && (
            <p className="text-gray-700 mt-2">
              Selecciona uno de tus items para intercambiar por <span className="font-semibold">{targetItem.title}</span> de {targetItem.owner.username}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items Selection */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrar mis items</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="Música">Música</option>
                  <option value="Electrónicos">Electrónicos</option>
                  <option value="Libros">Libros</option>
                  <option value="Deportes">Deportes</option>
                </select>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">Todas las condiciones</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Muy bueno">Muy bueno</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                </select>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-green-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-w-16 aspect-h-9">
                    {item.images && item.images.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={640}
                        height={360}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        conditionColors[item.condition as keyof typeof conditionColors]
                      }`}>
                        {item.condition}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[item.status as keyof typeof statusColors]
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    {selectedItem?.id === item.id && (
                      <div className="text-green-600 text-sm font-medium">
                        ✓ Seleccionado para intercambio
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron items</h3>
                <p className="text-gray-600">No tienes items disponibles que coincidan con los filtros seleccionados.</p>
                <Link href="/items/new" className="mt-4 inline-block">
                  <Button>Agregar nuevo item</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Exchange Summary */}
          <div className="space-y-6">
            {/* Target Item */}
            {targetItem && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item solicitado</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{targetItem.title}</h4>
                  <p className="text-gray-700 text-sm mt-1">Propietario: @{targetItem.owner.username}</p>
                  <p className="text-gray-600 text-sm">Reputación: {targetItem.owner.reputation_score}/5</p>
                  {targetItem.owner.city && targetItem.owner.state && (
                    <p className="text-gray-600 text-sm">{targetItem.owner.city}, {targetItem.owner.state}</p>
                  )}
                </div>
              </div>
            )}

            {/* Selected Item */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu item seleccionado</h3>
              {selectedItem ? (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium text-gray-900">{selectedItem.name}</h4>
                  <p className="text-gray-700 text-sm mt-1">{selectedItem.category}</p>
                  <p className="text-gray-600 text-sm">Condición: {selectedItem.condition}</p>
                  {selectedItem.estimatedValue && (
                    <p className="text-gray-600 text-sm">Valor estimado: €{selectedItem.estimatedValue}</p>
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Selecciona un item de la lista</p>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensaje (opcional)</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje para el propietario del item..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                maxLength={500}
              />
              <p className="text-gray-500 text-sm mt-2">{message.length}/500 caracteres</p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                <Button
                  onClick={handleProposeExchange}
                  disabled={!selectedItem}
                  className="w-full"
                >
                  Enviar propuesta de intercambio
                </Button>
                {targetItem && (
                  <Link href={`/exchanges/new?item_id=${targetItem.id}&owner_id=${targetItem.owner.id}&action=message`}>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Solo enviar mensaje
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}