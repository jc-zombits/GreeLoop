'use client';

import React, { useState } from 'react';
import { Search, ArrowUpDown, Clock, CheckCircle, XCircle, User, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type ExchangeStatus = 'Pendiente confirmación' | 'En proceso' | 'Completado' | 'Cancelado';

interface Exchange {
  id: number;
  myItem: {
    name: string;
    image: string;
  };
  theirItem: {
    name: string;
    image: string;
  };
  partner: {
    name: string;
    avatar: string;
    rating: number;
  };
  status: ExchangeStatus;
  createdAt: string;
  lastMessage: string;
  unreadMessages: number;
  completedAt?: string;
  cancelledAt?: string;
}

const exchanges: Exchange[] = [];

const statusConfig = {
  'Pendiente confirmación': {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  'En proceso': {
    color: 'bg-blue-100 text-blue-800',
    icon: ArrowUpDown
  },
  'Completado': {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  'Cancelado': {
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
};

export default function Exchanges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [exchangesList, setExchangesList] = useState<Exchange[]>(exchanges);

  const handleConfirmExchange = (exchangeId: number) => {
    setExchangesList(prevExchanges => 
      prevExchanges.map(exchange => 
        exchange.id === exchangeId 
          ? { ...exchange, status: 'Completado' as ExchangeStatus, completedAt: new Date().toISOString().split('T')[0] }
          : exchange
      )
    );
  };

  const filteredExchanges = exchangesList.filter(exchange => {
    const matchesSearch = 
      exchange.myItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exchange.theirItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exchange.partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || exchange.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Intercambios</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tus intercambios activos y revisa el historial de transacciones.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link href="/items/new">
            <Button className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Publicar Item
            </Button>
          </Link>
          <Link href="/categories">
            <Button variant="outline">
              Explorar Categorías
            </Button>
          </Link>
          <Link href="/items">
            <Button variant="outline">
              Ver Mis Items
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ArrowUpDown className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cancelados</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar intercambios..."
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
            <option value="Pendiente confirmación">Pendiente confirmación</option>
            <option value="En proceso">En proceso</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {/* Exchanges List */}
        <div className="space-y-6">
          {filteredExchanges.map((exchange) => {
            const StatusIcon = statusConfig[exchange.status as keyof typeof statusConfig].icon;
            return (
              <div key={exchange.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className="h-6 w-6 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Intercambio #{exchange.id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Iniciado el {exchange.createdAt}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      statusConfig[exchange.status as keyof typeof statusConfig].color
                    }`}>
                      {exchange.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* My Item */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Mi Item</h4>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{exchange.myItem.name}</p>
                      </div>
                    </div>

                    {/* Exchange Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <ArrowUpDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{exchange.partner.name}</p>
                            <p className="text-xs text-gray-500">★ {exchange.partner.rating}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Their Item */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Su Item</h4>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{exchange.theirItem.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Last Message */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{exchange.lastMessage}</p>
                      </div>
                      {exchange.unreadMessages > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {exchange.unreadMessages} nuevos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    <Link href={`/exchanges/${exchange.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Ver detalles
                      </Button>
                    </Link>
                    <Link href={`/exchanges/${exchange.id}/chat`}>
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                    {exchange.status === 'Pendiente confirmación' && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmExchange(exchange.id)}
                      >
                        Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredExchanges.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron intercambios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'Todos' 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Aún no tienes intercambios. ¡Explora items disponibles para comenzar!'
              }
            </p>
            {!searchTerm && statusFilter === 'Todos' && (
              <div className="mt-6">
                <Link href="/categories">
                  <Button>
                    Explorar items
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