'use client';

import React, { useState, useEffect } from 'react';
import { Toast } from '@/components/ui/Toast';
import { Plus, Package, ArrowUpDown, Users, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import CO2EducationalModal from '@/components/CO2EducationalModal';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

interface DashboardStatDef {
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change: string;
}

const initialStats: DashboardStatDef[] = [
  { name: 'Items Publicados', value: '0', icon: Package, change: '+0 esta semana' },
  { name: 'Intercambios Activos', value: '0', icon: ArrowUpDown, change: '+0 nuevo' },
  { name: 'Conexiones', value: '0', icon: Users, change: '+0 este mes' },
  { name: 'Impacto Ambiental', value: '0kg', icon: TrendingUp, change: 'CO2 ahorrado' },
];

interface RecentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  views: number;
  image?: string | null;
}

interface RecentExchange {
  id: string;
  title: string;
  status: string;
  date: string;
}

interface BackendItemListItem {
  id: string;
  title?: string;
  category_name?: string;
  status?: string;
  status_display?: string;
  view_count?: number;
  primary_image_url?: string | null;
}

interface BackendExchangeListItem {
  id: string;
  status?: string;
  status_display?: string;
  requester_item_title?: string;
  owner_item_title?: string;
  updated_at?: string;
  created_at?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBackendItemListItem(value: unknown): value is BackendItemListItem {
  return (
    isObject(value) &&
    'id' in value && typeof (value as Record<string, unknown>).id === 'string'
  );
}

function isBackendExchangeListItem(value: unknown): value is BackendExchangeListItem {
  return (
    isObject(value) &&
    'id' in value && typeof (value as Record<string, unknown>).id === 'string'
  );
}

export default function Dashboard() {
  const [isCO2ModalOpen, setIsCO2ModalOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStatDef[]>(initialStats);
  const [rewards, setRewards] = useState<{ points: number; tier: 'Bronce' | 'Plata' | 'Oro' | 'Platino'; nextTierAt: number } | null>(null);
  const [redemptionsSummary, setRedemptionsSummary] = useState<{ total_points_redeemed: number; redemptions: Array<{ reward_id?: string; reward_name?: string; points_cost: number; created_at: string; category?: string }> } | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentExchanges, setRecentExchanges] = useState<RecentExchange[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const msg = sessionStorage.getItem('flash_success');
      if (msg) {
        setFlashMessage(msg);
        sessionStorage.removeItem('flash_success');
        setTimeout(() => setFlashMessage(null), 4000);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.users.getStats();
        const totalItems = Number(data.total_items ?? 0);
        const activeItems = Number(data.active_items ?? 0);
        const totalExchanges = Number(data.total_exchanges ?? 0);
        const completedExchanges = Number(data.completed_exchanges ?? 0);
        const averageRating = Number(data.average_rating ?? 0);
        const updatedStats: DashboardStatDef[] = [
          { name: 'Items Publicados', value: String(totalItems), icon: Package, change: `${activeItems} activos` },
          { name: 'Intercambios Activos', value: String(totalExchanges), icon: ArrowUpDown, change: `${completedExchanges} completados` },
          { name: 'Conexiones', value: String(Math.max(0, Math.round(averageRating * 10))), icon: Users, change: 'Índice de reputación' },
          { name: 'Impacto Ambiental', value: `${completedExchanges * 2}kg`, icon: TrendingUp, change: 'CO2 ahorrado' },
        ];
        setStats(updatedStats);
        const points = completedExchanges * 50 + totalItems * 10 + Math.round(averageRating * 20);
        let tier: 'Bronce' | 'Plata' | 'Oro' | 'Platino' = 'Bronce';
        let nextTierAt = 100;
        if (points >= 100 && points < 300) {
          tier = 'Plata';
          nextTierAt = 300;
        } else if (points >= 300 && points < 600) {
          tier = 'Oro';
          nextTierAt = 600;
        } else if (points >= 600) {
          tier = 'Platino';
          nextTierAt = points + 100;
        }
        try {
          const r = await api.users.getRewards();
          setRewards({ points: r.points, tier: r.tier as 'Bronce' | 'Plata' | 'Oro' | 'Platino', nextTierAt: r.next_tier_at });
        } catch {
          setRewards({ points, tier, nextTierAt });
        }
      } catch {
        setStats(initialStats);
        setRewards({ points: 0, tier: 'Bronce', nextTierAt: 100 });
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRedemptions = async () => {
      try {
        const s = await api.users.getRewardRedemptionsSummary();
        setRedemptionsSummary(s);
      } catch {}
    };
    fetchRedemptions();
  }, []);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const resp = await api.users.getMyItems({ page: 1, page_size: 5 });
        const rawList = Array.isArray(resp) ? resp : (isObject(resp) && Array.isArray(resp.data)) ? resp.data : [];
        const mapped: RecentItem[] = (rawList as unknown[])
          .filter(isBackendItemListItem)
          .map((o) => ({
            id: String(o.id),
            title: o.title || 'Item',
            category: o.category_name || 'General',
            status: o.status_display || o.status || 'Disponible',
            views: Number(o.view_count || 0),
            image: o.primary_image_url ?? null,
          }));
        setRecentItems(mapped);
      } catch {
        setRecentItems([]);
      }
    };
    fetchRecentItems();
  }, []);

  useEffect(() => {
    const fetchRecentExchanges = async () => {
      try {
        const resp = await api.users.getMyExchanges({ page: 1, page_size: 5 });
        const rawList = Array.isArray(resp) ? resp : (isObject(resp) && Array.isArray(resp.data)) ? resp.data : [];
        const mapped: RecentExchange[] = (rawList as unknown[])
          .filter(isBackendExchangeListItem)
          .map((e) => ({
            id: String(e.id),
            title: e.owner_item_title || e.requester_item_title || 'Intercambio',
            status: e.status_display || e.status || 'En proceso',
            date: String(e.updated_at || e.created_at || ''),
          }));
        setRecentExchanges(mapped);
      } catch {
        setRecentExchanges([]);
      }
    };
    fetchRecentExchanges();
  }, []);

  const handleCO2CardClick = () => {
    setIsCO2ModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {flashMessage && (
          <Toast
            message={flashMessage}
            onClose={() => setFlashMessage(null)}
            duration={4000}
            variant="success"
          />
        )}
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
            const isEnvironmentalImpact = stat.name === 'Impacto Ambiental';
            
            return (
              <div 
                key={stat.name} 
                className={`bg-white rounded-lg shadow p-6 ${
                  isEnvironmentalImpact 
                    ? 'cursor-pointer hover:shadow-lg hover:bg-green-50 transition-all duration-200 border-2 border-transparent hover:border-green-200' 
                    : ''
                }`}
                onClick={isEnvironmentalImpact ? handleCO2CardClick : undefined}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${
                      isEnvironmentalImpact ? 'text-green-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                    {isEnvironmentalImpact && (
                      <p className="text-xs text-gray-500 mt-1">Click para saber más 💡</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rewards && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recompensas Verdes</h2>
                <Badge variant="success">{rewards.tier}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div>
                  <p className="text-sm text-gray-600">Puntos acumulados</p>
                  <p className="text-3xl font-bold text-gray-900">{rewards.points}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Progreso hacia el siguiente nivel</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    {(() => {
                      const currentBase = rewards.tier === 'Bronce' ? 0 : rewards.tier === 'Plata' ? 100 : rewards.tier === 'Oro' ? 300 : 600;
                      const nextBase = rewards.nextTierAt;
                      const progress = Math.max(0, Math.min(100, Math.round(((rewards.points - currentBase) / (nextBase - currentBase)) * 100)));
                      return <div className="bg-green-600 h-3 rounded-full" style={{ width: `${progress}%` }} />;
                    })()}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Nivel actual</span>
                    <span>{rewards.nextTierAt} pts</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Publica items</p>
                  <p className="text-xs text-gray-600">+10 pts por cada publicación</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Completa intercambios</p>
                  <p className="text-xs text-gray-600">+50 pts por intercambio</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Mejora tu reputación</p>
                  <p className="text-xs text-gray-600">Hasta +20 pts por calificación media</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Puntos redimidos</p>
                  <p className="text-sm font-semibold text-gray-900">{redemptionsSummary?.total_points_redeemed ?? 0}</p>
                </div>
                {redemptionsSummary?.redemptions?.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {redemptionsSummary.redemptions.slice(0, 3).map((r, idx) => {
                      const d = r.created_at ? new Date(r.created_at) : null;
                      const dateStr = d ? d.toLocaleDateString() : '';
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {r.reward_name || 'Recompensa'}
                            {r.category ? ` · ${r.category}` : ''}
                            {dateStr ? ` · ${dateStr}` : ''}
                          </span>
                          <span className="text-gray-900 font-medium">-{r.points_cost} pts</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Aún no has redimido puntos.</p>
                )}
                <div className="mt-3">
                  <Link href="/rewards/history">
                    <Button variant="ghost" size="sm">Ver historial completo</Button>
                  </Link>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        await api.users.recomputeRewards();
                        const r = await api.users.getRewards();
                        setRewards({ points: r.points, tier: r.tier as 'Bronce' | 'Plata' | 'Oro' | 'Platino', nextTierAt: r.next_tier_at });
                        setFlashMessage('Recompensas recalculadas');
                        setTimeout(() => setFlashMessage(null), 4000);
                      } catch {}
                    }}
                  >
                    Recalcular
                  </Button>
                  <Link href="/rewards">
                    <Button variant="outline">Redimir Puntos</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mis Items Recientes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.title} width={48} height={48} className="w-12 h-12 object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status.toLowerCase() === 'disponible' 
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
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tienes items recientes.</p>
                )}
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
                {recentExchanges.length > 0 ? (
                  recentExchanges.map((exchange) => (
                    <div key={exchange.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{exchange.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">{exchange.date}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          exchange.status.toLowerCase() === 'completado'
                            ? 'bg-green-100 text-green-800'
                            : exchange.status.toLowerCase() === 'en proceso'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exchange.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tienes intercambios recientes.</p>
                )}
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

        {/* CO2 Educational Modal */}
        <CO2EducationalModal
          isOpen={isCO2ModalOpen}
          onClose={() => setIsCO2ModalOpen(false)}
          co2Amount="0kg"
        />
      </div>
    </div>
  );
}
