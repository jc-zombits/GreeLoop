'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { ExchangeData } from '@/lib/api';
import { Exchange, ExchangeFilters, PaginatedResponse, Message } from '@/types';

export const useExchanges = (filters?: ExchangeFilters) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchExchanges = useCallback(async (page: number = 1, newFilters?: ExchangeFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...newFilters
      };

      const response: PaginatedResponse<Exchange> = await api.exchanges.list(params);
      
      setExchanges(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar intercambios');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const refetch = (newFilters?: ExchangeFilters) => {
    fetchExchanges(1, newFilters);
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchExchanges(pagination.page + 1);
    }
  };

  return {
    exchanges,
    loading,
    error,
    pagination,
    refetch,
    loadMore
  };
};

export const useExchange = (id: string) => {
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchange = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.get(id);
      setExchange(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar intercambio');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchExchange();
    }
  }, [id, fetchExchange]);

  const refetch = () => {
    fetchExchange();
  };

  return { exchange, loading, error, refetch };
};

export const useCreateExchange = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExchange = async (exchangeData: ExchangeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.create(exchangeData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear intercambio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createExchange,
    loading,
    error
  };
};

export const useExchangeActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptExchange = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.accept(id);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al aceptar intercambio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const rejectExchange = async (id: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.reject(id, reason ? { reason } : undefined);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al rechazar intercambio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelExchange = async (id: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.cancel(id, reason ? { reason } : undefined);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar intercambio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeExchange = async (id: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.complete(id, {
        completed: true,
        completion_notes: notes
      });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al completar intercambio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptExchange,
    rejectExchange,
    cancelExchange,
    completeExchange,
    loading,
    error
  };
};

export const useExchangeMessages = (exchangeId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exchanges.getMessages(exchangeId);
      setMessages(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [exchangeId]);

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    try {
      const response = await api.exchanges.sendMessage(exchangeId, {
        content,
        type
      });
      
      // Agregar el nuevo mensaje a la lista
      setMessages(prev => [...prev, response]);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (exchangeId) {
      fetchMessages();
    }
  }, [exchangeId, fetchMessages]);

  const refetch = () => {
    fetchMessages();
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch
  };
};