'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, Item, PaginatedResponse, ItemStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Search } from 'lucide-react';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPage() {
  type LegacyPagination<T> = {
    items: T[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };

  type UsersListResponse = PaginatedResponse<User> | LegacyPagination<User>;

  type AdminItem = Item & {
    title?: string;
    // El backend puede devolver estados en inglés, permitimos ambos
    status: ItemStatus | string;
  };

  type ItemsListResponse = PaginatedResponse<AdminItem> | LegacyPagination<AdminItem>;

  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [itemsPagination, setItemsPagination] = useState<Pagination | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');
  type AdminStatusCode = 'AVAILABLE' | 'INACTIVE' | 'RESERVED' | 'EXCHANGED';
  const [itemStatusFilter, setItemStatusFilter] = useState<AdminStatusCode | ''>('');

  const userParams = useMemo(() => ({ page: 1, page_size: 20, q: userQuery }), [userQuery]);
  const itemParams = useMemo(() => ({ page: 1, page_size: 20, status: itemStatusFilter }), [itemStatusFilter]);

  const parseStatusFilter = (value: string): AdminStatusCode | '' => {
    if (value === '') return '';
    const allowed = ['AVAILABLE', 'INACTIVE', 'RESERVED', 'EXCHANGED'] as const;
    return (allowed.includes(value as AdminStatusCode) ? (value as AdminStatusCode) : '');
  };

  const normalizeItemStatus = useCallback((status: unknown): ItemStatus => {
    const backendToLabel: Record<AdminStatusCode, ItemStatus> = {
      AVAILABLE: 'Disponible',
      INACTIVE: 'Inactivo',
      RESERVED: 'En intercambio',
      EXCHANGED: 'Intercambiado',
    };
    if (typeof status === 'string') {
      if ((['Disponible', 'En intercambio', 'Intercambiado', 'Inactivo'] as const).includes(status as ItemStatus)) {
        return status as ItemStatus;
      }
      if ((['AVAILABLE', 'INACTIVE', 'RESERVED', 'EXCHANGED'] as const).includes(status as AdminStatusCode)) {
        return backendToLabel[status as AdminStatusCode];
      }
    }
    return 'Disponible';
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const res = await api.admin.users.list(userParams);
        // Manejo de respuesta como array simple del backend
        if (Array.isArray(res)) {
          const arr = res as User[];
          setUsers(arr);
          setUsersPagination({ page: 1, limit: arr.length, total: arr.length, totalPages: 1 });
        } else {
          const data = res as UsersListResponse;
          if ('pagination' in data) {
            setUsers(data.data || []);
            setUsersPagination(data.pagination);
          } else {
            // backend puede responder con {items, total,...}
            setUsers(data.items || []);
            setUsersPagination({
              page: data.page || 1,
              limit: data.page_size || 20,
              total: data.total || (data.items?.length || 0),
              totalPages: data.total_pages || 1,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No autorizado o error al cargar usuarios';
        setError(message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const loadItems = async () => {
      setLoadingItems(true);
      try {
        const res = await api.admin.items.list(itemParams);
        // Manejo de respuesta como array simple del backend
        if (Array.isArray(res)) {
          const arr = (res as AdminItem[]).map(i => ({
            ...i,
            status: normalizeItemStatus((i as { status: unknown }).status),
          }));
          setItems(arr);
          setItemsPagination({ page: 1, limit: arr.length, total: arr.length, totalPages: 1 });
        } else {
          const data = res as ItemsListResponse;
          if ('pagination' in data) {
            setItems((data.data || []).map(i => ({
              ...i,
              status: normalizeItemStatus((i as { status: unknown }).status),
            })));
            setItemsPagination(data.pagination);
          } else {
            setItems((data.items || []).map(i => ({
              ...i,
              status: normalizeItemStatus((i as { status: unknown }).status),
            })));
            setItemsPagination({
              page: data.page || 1,
              limit: data.page_size || 20,
              total: data.total || (data.items?.length || 0),
              totalPages: data.total_pages || 1,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No autorizado o error al cargar items';
        setError(message);
      } finally {
        setLoadingItems(false);
      }
    };

    loadUsers();
    loadItems();
  }, [userParams, itemParams, normalizeItemStatus]);

  const handleDeactivateUser = async (id: string) => {
    try {
      await api.admin.users.update(id, { is_active: false } as Partial<User>);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_active: false } : u)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(message);
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await api.admin.users.update(id, { is_active: true } as Partial<User>);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_active: true } : u)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al activar usuario';
      setError(message);
    }
  };

  const handleItemStatus = async (id: string, status: AdminStatusCode) => {
    try {
      await api.admin.items.updateStatus(id, status);
      const newStatus = normalizeItemStatus(status);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, status: newStatus } : i)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado del item';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Usuarios */}
        <Card className="card-verdoso shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xl">Usuarios</CardTitle>
            <div className="w-full max-w-xs">
              <Input
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                placeholder="Buscar usuarios"
                icon={Search}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <p className="text-gray-600">Cargando usuarios...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr>
                      <th className="p-3 text-sm font-semibold text-gray-800">Nombre</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Email</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Estado</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-200">
                    {(
                      // Filtro en cliente por nombre/usuario/ciudad
                      userQuery.trim()
                        ? users.filter(u => {
                            const q = userQuery.trim().toLowerCase();
                            const name = (u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}` || u.username || '').toLowerCase();
                            const city = (u.city || '').toLowerCase();
                            const username = (u.username || '').toLowerCase();
                            return name.includes(q) || username.includes(q) || city.includes(q);
                          })
                        : users
                    ).map(u => (
                      <tr key={u.id} className="hover-verdoso-suave">
                        <td className="p-3 text-gray-900 font-medium">{u.full_name || `${u.first_name} ${u.last_name}` || u.username}</td>
                        <td className="p-3 text-gray-700">{(u as unknown as { email?: string }).email ?? '—'}</td>
                        <td className="p-3">
                          <StatusBadge status={u.is_active ? 'Activo' : 'Inactivo'} />
                        </td>
                        <td className="p-3">
                          {u.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleDeactivateUser(u.id)}
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleActivateUser(u.id)}
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => api.admin.users.delete(u.id)}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usersPagination && (
                  <p className="text-sm text-gray-500 mt-2">Total: {usersPagination.total}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="card-verdoso shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xl">Items</CardTitle>
            <div className="flex items-center gap-2">
              <label htmlFor="status" className="text-sm text-gray-700">Estado</label>
              <select
                id="status"
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                value={itemStatusFilter}
                onChange={e => setItemStatusFilter(parseStatusFilter(e.target.value))}
              >
                <option value="">Todos</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="RESERVED">Reservado</option>
                <option value="EXCHANGED">Intercambiado</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <p className="text-gray-600">Cargando items...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr>
                      <th className="p-3 text-sm font-semibold text-gray-800">Título</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Estado</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Dueño</th>
                      <th className="p-3 text-sm font-semibold text-gray-800">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-200">
                    {(
                      // Filtro en cliente por estado si el backend no lo soporta
                      itemStatusFilter
                        ? items.filter(i => normalizeItemStatus((i as { status: unknown }).status) === normalizeItemStatus(itemStatusFilter))
                        : items
                    ).map(i => (
                      <tr key={i.id} className="hover-verdoso-suave">
                        <td className="p-3 text-gray-900 font-medium">{i.title ?? i.name}</td>
                        <td className="p-3">
                          <StatusBadge status={String(i.status)} />
                        </td>
                        <td className="p-3">{(i.owner && (i.owner.full_name || i.owner.username)) || '—'}</td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleItemStatus(i.id, 'INACTIVE')}
                          >
                            Desactivar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleItemStatus(i.id, 'AVAILABLE')}
                          >
                            Activar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {itemsPagination && (
                  <p className="text-sm text-gray-500 mt-2">Total: {itemsPagination.total}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}