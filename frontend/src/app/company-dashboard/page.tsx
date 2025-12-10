'use client';

import React, { useState, useEffect } from 'react';
import { Toast } from '@/components/ui/Toast';
import { Plus, Heart, Users, TrendingUp, Eye, Building2, Gift, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { isCompany } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

// Estadísticas específicas para empresas
const companyStats = [
  { name: 'Contribuciones Activas', value: '0', icon: Gift, change: '+0 esta semana', color: 'text-blue-600' },
  { name: 'Beneficiarios Alcanzados', value: '0', icon: Users, change: '+0 este mes', color: 'text-green-600' },
  { name: 'Impacto Social', value: '0', icon: Heart, change: 'personas ayudadas', color: 'text-red-600' },
  { name: 'Visibilidad', value: '0', icon: TrendingUp, change: 'visualizaciones', color: 'text-purple-600' },
];

interface RecentContribution {
  id: string;
  title: string;
  category: string;
  status: string;
  views: number;
  interestedCount: number;
  createdAt: string;
}

interface ContributionRequest {
  id: string;
  contributionTitle: string;
  requesterName: string;
  status: string;
  requestDate: string;
  location: string;
}

// Datos de ejemplo (en producción vendrían de la API)
const recentContributions: RecentContribution[] = [];
const contributionRequests: ContributionRequest[] = [];

export default function CompanyDashboard() {
  const { user, userType, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [rewards, setRewards] = useState<{ points: number; tier: string; next_tier_at: number } | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!loading) {
      if (!user || userType !== 'company') {
        router.push('/auth');
        return;
      }
      setIsLoading(false);
    }
  }, [user, userType, loading, router]);

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
    const fetchRewards = async () => {
      if (!user || userType !== 'company') return;
      try {
        setRewardsLoading(true);
        const data = await api.companyAuth.getRewards();
        setRewards(data);
      } catch (err) {
        // Silenciar errores de forma no intrusiva en el dashboard
        console.error('Error cargando recompensas de empresa:', err);
      } finally {
        setRewardsLoading(false);
      }
    };
    fetchRewards();
  }, [user, userType]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const companyName = user && isCompany(user) ? user.company_name : user?.username || 'Empresa';

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
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Empresarial</h1>
          </div>
          <p className="text-gray-600">
            Bienvenido de vuelta, <span className="font-semibold text-green-600">{companyName}</span>. 
            Gestiona tus contribuciones y mide tu impacto social.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link href="/contributions/new">
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5" />
              Nueva Contribución
            </Button>
          </Link>
          <Link href="/contributions">
            <Button variant="outline" className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Ver Mis Contribuciones
            </Button>
          </Link>
          <Link href="/contributions/categories">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Explorar Categorías
            </Button>
          </Link>
          <Link href="/contributions/requests">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Solicitudes Recibidas
            </Button>
          </Link>
        </div>

        {/* Rewards Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recompensas</h2>
              {rewards ? (
                <Badge variant="success">{rewards.tier}</Badge>
              ) : (
                <Badge variant="default">{rewardsLoading ? 'Cargando…' : 'Bronce'}</Badge>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Puntos</span>
                <span className="font-semibold text-gray-900">{rewards ? rewards.points : 0}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Progreso al siguiente nivel</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {(() => {
                    const tier = rewards?.tier || 'Bronce';
                    const points = rewards?.points || 0;
                    const nextAt = rewards?.next_tier_at || 100;
                    const currentBase = tier === 'Bronce' ? 0 : tier === 'Plata' ? 100 : tier === 'Oro' ? 300 : 600;
                    const progress = Math.max(0, Math.min(100, Math.round(((points - currentBase) / (nextAt - currentBase)) * 100)));
                    return <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }} />;
                  })()}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Nivel actual</span>
                  <span>{rewards ? rewards.next_tier_at : 100} pts</span>
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await api.companyAuth.recomputeRewards();
                    const data = await api.companyAuth.getRewards();
                    setRewards(data);
                    setFlashMessage('Recompensas recalculadas');
                    setTimeout(() => setFlashMessage(null), 4000);
                  } catch (err) {
                    console.error('Error al recalcular recompensas:', err);
                  }
                }}
                className="w-full"
              >
                Recalcular
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {companyStats.map((stat) => {
            const Icon = stat.icon;
            
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Contributions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Contribuciones Recientes
              </h2>
            </div>
            <div className="p-6">
              {recentContributions.length > 0 ? (
                <div className="space-y-4">
                  {recentContributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Gift className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{contribution.title}</h3>
                          <p className="text-sm text-gray-500">{contribution.category}</p>
                          <p className="text-xs text-gray-400">{contribution.createdAt}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contribution.status === 'Activa' 
                            ? 'bg-green-100 text-green-800'
                            : contribution.status === 'Completada'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contribution.status}
                        </span>
                        <div className="flex items-center mt-1 text-sm text-gray-500 gap-3">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {contribution.views}
                          </div>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {contribution.interestedCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contribuciones aún</h3>
                  <p className="text-gray-500 mb-4">Comienza creando tu primera contribución para ayudar a la comunidad.</p>
                  <Link href="/contributions/new">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Contribución
                    </Button>
                  </Link>
                </div>
              )}
              
              {recentContributions.length > 0 && (
                <div className="mt-6">
                  <Link href="/contributions">
                    <Button variant="outline" className="w-full">
                      Ver todas las contribuciones
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Contribution Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Solicitudes Recientes
              </h2>
            </div>
            <div className="p-6">
              {contributionRequests.length > 0 ? (
                <div className="space-y-4">
                  {contributionRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{request.contributionTitle}</h3>
                          <p className="text-sm text-gray-600">Solicitado por {request.requesterName}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500 gap-4">
                            <span>{request.requestDate}</span>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {request.location}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'Aprobada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
                  <p className="text-gray-500">Las solicitudes de contribuciones aparecerán aquí cuando las recibas.</p>
                </div>
              )}
              
              {contributionRequests.length > 0 && (
                <div className="mt-6">
                  <Link href="/contributions/requests">
                    <Button variant="outline" className="w-full">
                      Ver todas las solicitudes
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumen de Impacto Social</h3>
              <p className="text-gray-600">
                Tu empresa está contribuyendo positivamente a la comunidad. 
                Cada contribución cuenta para crear un mundo más sostenible.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-500">Personas impactadas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
