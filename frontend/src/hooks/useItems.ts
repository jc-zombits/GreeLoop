'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Item, ItemFilters, PaginatedResponse } from '@/types';

export const useItems = (filters?: ItemFilters) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const fetchItems = async (page: number = 1, newFilters?: ItemFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...newFilters
      };

      const response: PaginatedResponse<Item> = await api.items.list(params);
      
      setItems(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const refetch = (newFilters?: ItemFilters) => {
    fetchItems(1, newFilters);
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchItems(pagination.page + 1);
    }
  };

  return {
    items,
    loading,
    error,
    pagination,
    refetch,
    loadMore
  };
};

export const useItem = (id: string) => {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.items.get(id);
        setItem(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar item');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  return { item, loading, error };
};

export const useCreateItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (itemData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.items.create(itemData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (itemId: string, files: File[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await api.items.uploadImages(itemId, formData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir imágenes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createItem,
    uploadImages,
    loading,
    error
  };
};

export const useUpdateItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = async (id: string, itemData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.items.update(id, itemData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateItem,
    loading,
    error
  };
};

export const useDeleteItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.items.delete(id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteItem,
    loading,
    error
  };
};