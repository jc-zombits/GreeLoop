'use client';

import React from 'react';
import { Plus, Package, ArrowUpDown, Users, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const stats = [
  { name: 'Items Publicados', value: '0', icon: Package, change: '+0 esta semana' },
  { name: 'Intercambios Activos', value: '0', icon: ArrowUpDown, change: '+0 nuevo' },
  { name: 'Conexiones', value: '0', icon: Users, change: '+0 este mes' },
  { name: 'Impacto Ambiental', value: '0kg', icon: TrendingUp, change: 'CO2 ahorrado' },
];

interface RecentItem {
  id: number;
  name: string;
  category: string;
  status: string;
  views: number;
  image: string;
}

interface RecentExchange {
  id: number;
  item: string;
  partner: string;
  status: string;
  date: string;
}

const recentItems: RecentItem[] = [];

const recentExchanges: RecentExchange[] = [];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido de vuelta. Aquí tienes un resumen de tu actividad en GreenLoop.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link href="/items/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Publicar Item
            </Button>
          </Link>
          <Link href="/categories">
            <Button variant="outline">
              Explorar Categorías
            </Button>
          </Link>
          <Link href="/exchanges">
            <Button variant="outline">
              Ver Intercambios
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mis Items Recientes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Disponible' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        {item.views}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/items">
                  <Button variant="outline" className="w-full">
                    Ver todos mis items
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Exchanges */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Intercambios Recientes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentExchanges.map((exchange) => (
                  <div key={exchange.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{exchange.item}</h3>
                        <p className="text-sm text-gray-500">con {exchange.partner}</p>
                        <p className="text-xs text-gray-400 mt-1">{exchange.date}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exchange.status === 'Completado'
                          ? 'bg-green-100 text-green-800'
                          : exchange.status === 'En proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exchange.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/exchanges">
                  <Button variant="outline" className="w-full">
                    Ver todos los intercambios
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}