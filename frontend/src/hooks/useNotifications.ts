'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Notification } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export const useNotifications = () => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  type NotificationSearchResponse = {
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      notification_type: string;
      priority: string;
      is_read: boolean;
      action_url?: string;
      action_text?: string;
      created_at: string;
      priority_display: string;
      type_display: string;
      time_ago: string;
    }>;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    unread_count: number;
    high_priority_count: number;
    expired_count: number;
  };

  const fetchNotifications = useCallback(async (page: number = 1, filters?: Record<string, string | number | boolean>) => {
    // No hacer petición si el usuario no está autenticado o no hay token
    const token = localStorage.getItem('access_token');
    if (!user || authLoading || !token) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination?.limit ?? 20,
        ...filters
      };

      const response: NotificationSearchResponse = await api.notifications.list(params);
      const items: Notification[] = response.notifications.map(n => {
        const t = typeof n.notification_type === 'string' ? n.notification_type.toLowerCase() : '';
        let type: Notification['type'] = 'system';
        if (t.includes('exchange') && t.includes('request')) type = 'exchange_proposal';
        else if (t.includes('exchange') && t.includes('accepted')) type = 'exchange_accepted';
        else if (t.includes('exchange') && t.includes('rejected')) type = 'exchange_rejected';
        else if (t.includes('exchange') && t.includes('completed')) type = 'exchange_completed';
        else if (t.includes('message')) type = 'new_message';
        return {
          id: n.id,
          userId: user?.id || '',
          type,
          title: n.title,
          message: n.message,
          data: undefined,
          read: n.is_read,
          createdAt: n.created_at,
        };
      });

      if (page === 1) {
        setNotifications(items);
      } else {
        setNotifications(prev => [...prev, ...items]);
      }

      setPagination(prev => ({
        page: response.page ?? page,
        limit: response.page_size ?? (prev?.limit ?? 20),
        total: response.total ?? (prev?.total ?? 0),
        totalPages: response.total_pages ?? (prev?.totalPages ?? 0)
      }));

      const unread = items.filter(n => n.read === false).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [pagination?.limit, user, authLoading]);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Actualizar contador de no leídas
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como leída');
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar todas como leídas');
      throw err;
    }
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchNotifications(pagination.page + 1);
    }
  };

  const refetch = () => {
    fetchNotifications(1);
  };

  useEffect(() => {
    // Solo cargar notificaciones si el usuario está autenticado y hay token
    const token = localStorage.getItem('access_token');
    if (user && !authLoading && token) {
      fetchNotifications();
    } else if ((!user || !token) && !authLoading) {
      // Limpiar estado si no hay usuario o token
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
    }
  }, [user, authLoading, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    pagination,
    markAsRead,
    markAllAsRead,
    loadMore,
    refetch
  };
};

interface NotificationSettingsType {
  email_enabled?: boolean;
  push_enabled?: boolean;
  exchange_updates?: boolean;
  new_messages?: boolean;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notifications.getSettings();
      setSettings(response as NotificationSettingsType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings: NotificationSettingsType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notifications.updateSettings(newSettings);
      setSettings(response as NotificationSettingsType);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
};
