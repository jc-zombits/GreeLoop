'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Item, ItemFilters, ItemCondition, ItemStatus, User } from '@/types';

interface ItemApi {
  id?: string | number;
  item_id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  category_name?: string;
  category?: string;
  condition?: string;
  condition_display?: string;
  estimated_value?: number;
  estimatedValue?: number;
  city?: string;
  location?: string;
  tags?: string[];
  images?: string[];
  primary_image_url?: string;
  owner_id?: string;
  ownerId?: string;
  owner?: unknown;
  status?: string;
  status_display?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  view_count?: number;
  views?: number;
  like_count?: number;
  likes?: number;
}

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

  const mapItemFromApi = (raw: ItemApi): Item => {
    return {
      id: String(raw.id ?? raw.item_id ?? ''),
      name: raw.title ?? raw.name ?? '',
      description: raw.description ?? '',
      category: raw.category_name ?? raw.category ?? '',
      condition: (raw.condition_display ?? raw.condition ?? 'Bueno') as ItemCondition,
      estimatedValue: raw.estimated_value ?? raw.estimatedValue ?? undefined,
      location: raw.city ?? raw.location ?? '',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      images: Array.isArray(raw.images) ? raw.images : (raw.primary_image_url ? [raw.primary_image_url] : []),
      ownerId: raw.owner_id ?? raw.ownerId ?? '',
      owner: (raw.owner as unknown as User) ?? ({} as User),
      status: (raw.status_display ?? raw.status ?? 'Disponible') as ItemStatus,
      createdAt: raw.created_at ?? raw.createdAt ?? '',
      updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
      views: raw.view_count ?? raw.views ?? 0,
      likes: raw.like_count ?? raw.likes ?? 0,
    };
  };

  const fetchItems = useCallback(async (page: number = 1, newFilters?: ItemFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...newFilters
      };

      const response = (await api.items.list(params)) as unknown as { data: ItemApi[]; pagination?: { page: number; limit: number; total: number; totalPages: number } };
      const mapped = Array.isArray(response?.data) ? response.data.map(mapItemFromApi) : [];
      setItems(mapped);
      setPagination(response?.pagination ?? {
        page: page,
        limit: params.limit ?? pagination.limit,
        total: mapped.length,
        totalPages: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar items');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
        const response = (await api.items.get(id)) as unknown as ItemApi;
        const mapped: Item = {
          id: String(response.id ?? ''),
          name: response.title ?? response.name ?? '',
          description: response.description ?? '',
          category: response.category_name ?? response.category ?? '',
          condition: (response.condition_display ?? response.condition ?? 'Bueno') as ItemCondition,
          estimatedValue: response.estimated_value ?? response.estimatedValue ?? undefined,
          location: response.city ?? response.location ?? '',
          tags: Array.isArray(response.tags) ? response.tags : [],
          images: Array.isArray(response.images) ? response.images : (response.primary_image_url ? [response.primary_image_url] : []),
          ownerId: response.owner_id ?? response.ownerId ?? '',
          owner: (response.owner as unknown as User) ?? ({} as User),
          status: (response.status_display ?? response.status ?? 'Disponible') as ItemStatus,
          createdAt: response.created_at ?? response.createdAt ?? '',
          updatedAt: response.updated_at ?? response.updatedAt ?? '',
          views: response.view_count ?? response.views ?? 0,
          likes: response.like_count ?? response.likes ?? 0,
        };
        setItem(mapped);
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
      files.forEach((file) => {
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

  const updateItem = async (
    id: string,
    itemData: Partial<{
      title: string;
      description: string;
      category_id: string | number;
      condition: string;
      estimated_value?: number;
      location?: string;
    }>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const payload: {
        title?: string;
        description?: string;
        category_id?: number;
        condition?: string;
        estimated_value?: number;
        location?: string;
      } = {
        title: itemData.title,
        description: itemData.description,
        category_id:
          itemData.category_id !== undefined && itemData.category_id !== null && itemData.category_id !== ''
            ? Number(itemData.category_id)
            : undefined,
        condition: itemData.condition,
        estimated_value: itemData.estimated_value,
        location: itemData.location,
      };
      const response = await api.items.update(id, payload);
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
