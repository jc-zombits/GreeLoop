'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, User, Calendar, Package, MapPin } from 'lucide-react';

interface ExchangeItem {
  id: string;
  title: string;
  description: string;
  category_name: string;
  condition_display: string;
  primary_image_url?: string;
  estimated_value?: number;
}

interface ExchangeUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  city?: string;
  state?: string;
  rating?: number;
}

interface ExchangeDetail {
  id: string;
  status: string;
  requester_id: string;
  owner_id: string;
  requester_item: ExchangeItem;
  owner_item: ExchangeItem;
  initial_message?: string;
  proposed_cash_difference?: number;
  meeting_date?: string;
  meeting_location?: string;
  meeting_notes?: string;
  created_at: string;
  updated_at: string;
  status_display: string;
  can_cancel: boolean;
  can_confirm_meeting: boolean;
  can_complete: boolean;
  days_since_created: number;
}

export default function ExchangeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exchange, setExchange] = useState<ExchangeDetail | null>(null);
  const [requester, setRequester] = useState<ExchangeUser | null>(null);
  const [owner, setOwner] = useState<ExchangeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeDetail = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No estás autenticado');
          return;
        }

        const response = await fetch(`/api/v1/exchanges/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Intercambio no encontrado');
          } else if (response.status === 403) {
            setError('No tienes permisos para ver este intercambio');
          } else {
            setError('Error al cargar los detalles del intercambio');
          }
          return;
        }

        const exchangeData = await response.json();
        setExchange(exchangeData);

        // Obtener información de los usuarios
        const [requesterResponse, ownerResponse] = await Promise.all([
          fetch(`/api/v1/users/${exchangeData.requester_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`/api/v1/users/${exchangeData.owner_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (requesterResponse.ok && ownerResponse.ok) {
          const [requesterData, ownerData] = await Promise.all([
            requesterResponse.json(),
            ownerResponse.json()
          ]);
          setRequester(requesterData);
          setOwner(ownerData);
        }
      } catch (err) {
        console.error('Error fetching exchange details:', err);
        setError('Error al cargar los detalles del intercambio');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExchangeDetail();
    }
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del intercambio...</p>
        </div>
      </div>
    );
  }

  if (error || !exchange) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Intercambio no encontrado'}</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a intercambios
          </button>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(exchange.status)}`}>
            {getStatusText(exchange.status)}
          </span>
        </div>

        {/* Exchange Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Intercambio #{exchange.id}
            </h1>
            <div className="flex items-center text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(exchange.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {exchange.initial_message && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Mensaje del solicitante:</h3>
              <p className="text-blue-800">{exchange.initial_message}</p>
            </div>
          )}

          {exchange.proposed_cash_difference && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-medium text-yellow-900 mb-2">Diferencia en efectivo propuesta:</h3>
              <p className="text-yellow-800">${exchange.proposed_cash_difference}</p>
            </div>
          )}

          {exchange.meeting_date && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">Fecha de encuentro:</h3>
              <p className="text-green-800">
                {new Date(exchange.meeting_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {exchange.meeting_location && (
                <p className="text-green-800 mt-1">Ubicación: {exchange.meeting_location}</p>
              )}
              {exchange.meeting_notes && (
                <p className="text-green-800 mt-1">Notas: {exchange.meeting_notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Exchange Items */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Requester Item */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Objeto ofrecido
              </h2>
            </div>
            <div className="p-6">
              <img
                src={exchange.requester_item.primary_image_url || '/api/placeholder/400/300'}
                alt={exchange.requester_item.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{exchange.requester_item.title}</h3>
              <p className="text-gray-800 mb-4">{exchange.requester_item.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Categoría:</span>
                  <span className="font-medium text-gray-900">{exchange.requester_item.category_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Condición:</span>
                  <span className="font-medium text-gray-900">{exchange.requester_item.condition_display}</span>
                </div>
                {exchange.requester_item.estimated_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Valor estimado:</span>
                    <span className="font-medium text-gray-900">${exchange.requester_item.estimated_value}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requested Item */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Objeto solicitado
              </h2>
            </div>
            <div className="p-6">
              <img
                src={exchange.owner_item.primary_image_url || '/api/placeholder/400/300'}
                alt={exchange.owner_item.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{exchange.owner_item.title}</h3>
              <p className="text-gray-800 mb-4">{exchange.owner_item.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Categoría:</span>
                  <span className="font-medium text-gray-900">{exchange.owner_item.category_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Condición:</span>
                  <span className="font-medium text-gray-900">{exchange.owner_item.condition_display}</span>
                </div>
                {exchange.owner_item.estimated_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Valor estimado:</span>
                    <span className="font-medium text-gray-900">${exchange.owner_item.estimated_value}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Requester */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Solicitante
            </h2>
            <div className="space-y-3">
              {requester && (
                <>
                  <div>
                    <span className="text-gray-700">Nombre:</span>
                    <span className="ml-2 font-medium text-gray-900">{requester.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Usuario:</span>
                    <span className="ml-2 font-medium text-gray-900">@{requester.username}</span>
                  </div>
                  {(requester.city || requester.state) && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-gray-800">
                        {[requester.city, requester.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Propietario
            </h2>
            <div className="space-y-3">
              {owner && (
                <>
                  <div>
                    <span className="text-gray-700">Nombre:</span>
                    <span className="ml-2 font-medium text-gray-900">{owner.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Usuario:</span>
                    <span className="ml-2 font-medium text-gray-900">@{owner.username}</span>
                  </div>
                  {(owner.city || owner.state) && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-gray-800">
                        {[owner.city, owner.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar mensaje
            </button>
            {exchange.status === 'pending' && (
              <>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Aceptar intercambio
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  Rechazar intercambio
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}