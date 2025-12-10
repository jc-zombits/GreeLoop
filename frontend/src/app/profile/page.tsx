'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Star, Package, ArrowUpDown, Settings, Camera, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { isUser } from '@/types';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

type ActivityItem = { id: string; type: 'exchange' | 'item' | 'review'; description: string; date: string; status?: string };
type ItemListLite = { id: string; title?: string; name?: string; created_at?: string; createdAt?: string; status?: string; status_display?: string };
type ExchangeListLite = { id: string; status?: string; status_display?: string; created_at?: string; updated_at?: string; createdAt?: string; updatedAt?: string };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<{ total_items: number; total_exchanges: number; average_rating: number } | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [rewards, setRewards] = useState<{ points: number; tier: string; next_tier_at: number } | null>(null);
  
  // Inicializar estados con valores por defecto
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    joinDate: ''
  });
  const [editForm, setEditForm] = useState(userInfo);

  // Actualizar estados cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.full_name || (isUser(user) ? user.first_name : user.full_name) || user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.city || '',
        bio: user.bio || '',
        joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
      };
      setUserInfo(userData);
      setEditForm(userData);
    }
  }, [user]);

  // Cargar estadísticas y actividad recientes reales
  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;
        const [s, r, myItems, myExchanges] = await Promise.all([
          api.users.getStats(),
          api.users.getRewards(),
          api.users.getMyItems({ page: 1, page_size: 5 }),
          api.users.getMyExchanges({ page: 1, page_size: 5 })
        ]);
        setStats({
          total_items: s.total_items ?? 0,
          total_exchanges: s.total_exchanges ?? (user.total_exchanges ?? 0),
          average_rating: s.average_rating ?? (user.reputation_score ?? 0)
        });
        setRewards(r);
        const items: ActivityItem[] = Array.isArray(myItems)
          ? (myItems as unknown[]).map((raw) => {
              const it = raw as ItemListLite;
              return {
                id: String(it.id),
                type: 'item',
                description: `Nuevo item publicado: ${it.title ?? it.name ?? 'Item'}`,
                date: it.created_at ?? it.createdAt ?? '',
                status: it.status_display ?? it.status
              };
            })
          : [];
        const exchanges: ActivityItem[] = Array.isArray(myExchanges)
          ? (myExchanges as unknown[]).map((raw) => {
              const ex = raw as ExchangeListLite;
              return {
                id: String(ex.id),
                type: 'exchange',
                description: `Intercambio ${ex.status_display ?? ex.status ?? ''}`,
                date: ex.updated_at ?? ex.created_at ?? ex.updatedAt ?? ex.createdAt ?? '',
                status: ex.status_display ?? ex.status
              };
            })
          : [];
        const combined = [...items, ...exchanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivity(combined);
      } catch (e) {
        console.error('Error cargando estadísticas/actividad:', e);
        setStats(null);
        setActivity([]);
        setRewards(null);
      }
    };
    load();
  }, [user]);
  
  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Actualizar el usuario en el contexto
      if (updateUser) {
        await updateUser({
          ...user,
          ...editForm
        });
      }
      setUserInfo(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu información personal y configuraciones de cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-green-600" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-2 hover:bg-green-700">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{userInfo.name}</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-3" />
                      {userInfo.email}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-3" />
                      {userInfo.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3" />
                      {userInfo.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3" />
                      Miembro desde {userInfo.joinDate}
                    </div>
                  </div>
                </div>
              </div>

              {userInfo.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Biografía</h4>
                  <p className="text-gray-600">{userInfo.bio}</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Actividad Reciente</h2>
              {activity.length === 0 ? (
                <p className="text-sm text-gray-600">No hay actividad reciente aún.</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        a.status === 'completed' || a.status === 'Completado' ? 'bg-green-500' :
                        a.status === 'active' || a.status === 'Disponible' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{a.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(a.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {rewards && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recompensas</h2>
                  <Badge variant="success">{rewards.tier}</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Puntos</span>
                    <span className="font-semibold text-gray-900">{rewards.points}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Progreso al siguiente nivel</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const currentBase = rewards.tier === 'Bronce' ? 0 : rewards.tier === 'Plata' ? 100 : rewards.tier === 'Oro' ? 300 : 600;
                        const nextBase = rewards.next_tier_at;
                        const progress = Math.max(0, Math.min(100, Math.round(((rewards.points - currentBase) / (nextBase - currentBase)) * 100)));
                        return <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }} />;
                      })()}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Nivel actual</span>
                      <span>{rewards.next_tier_at} pts</span>
                    </div>
                  </div>
                  <Button onClick={() => api.users.recomputeRewards()} className="w-full">Recalcular</Button>
                </div>
              </div>
            )}
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Estadísticas</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Items Publicados</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.total_items ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ArrowUpDown className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Intercambios Realizados</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.total_exchanges ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Calificación Promedio</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.average_rating ?? 0}/5</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Miembro desde</span>
                  </div>
                  <span className="font-semibold text-gray-900">{userInfo.joinDate || '-'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Ver mis items
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Mis intercambios
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Mis reseñas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Perfil"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            name="name"
            value={editForm.name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={editForm.email}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Teléfono"
            name="phone"
            value={editForm.phone}
            onChange={handleInputChange}
          />
          <Input
            label="Ubicación"
            name="location"
            value={editForm.location}
            onChange={handleInputChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biografía
            </label>
            <textarea
              name="bio"
              value={editForm.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Cuéntanos sobre ti..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configuración de Cuenta"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notificaciones</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Notificaciones por email</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Notificaciones push</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="ml-2 text-sm text-gray-700">Newsletter semanal</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Privacidad</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Perfil público</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Mostrar estadísticas</span>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
              Eliminar Cuenta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
