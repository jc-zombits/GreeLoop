'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PaginatedResponse } from '@/types';

interface Rating {
  id: string;
  exchange_id: string;
  rater_id: string;
  rated_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  exchange?: any;
  rater?: any;
  rated_user?: any;
}

interface CreateRatingData {
  exchange_id: string;
  rated_user_id: string;
  rating: number;
  comment?: string;
}

interface UpdateRatingData {
  rating?: number;
  comment?: string;
}

export const useRatings = (userId?: string) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchRatings = async (page: number = 1, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        user_id: userId,
        ...filters
      };

      const response: PaginatedResponse<Rating> = await api.ratings.list(params);
      
      if (page === 1) {
        setRatings(response.data);
      } else {
        setRatings(prev => [...prev, ...response.data]);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchRatings(pagination.page + 1);
    }
  };

  const refetch = (filters?: any) => {
    fetchRatings(1, filters);
  };

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  return {
    ratings,
    loading,
    error,
    pagination,
    loadMore,
    refetch
  };
};

export const useRating = (id: string) => {
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRating = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ratings.get(id);
      setRating(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar calificación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRating();
    }
  }, [id]);

  const refetch = () => {
    fetchRating();
  };

  return { rating, loading, error, refetch };
};

export const useCreateRating = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRating = async (ratingData: CreateRatingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ratings.create(ratingData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear calificación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createRating,
    loading,
    error
  };
};

export const useUpdateRating = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRating = async (id: string, ratingData: UpdateRatingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ratings.update(id, ratingData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar calificación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateRating,
    loading,
    error
  };
};

export const useDeleteRating = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRating = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.ratings.delete(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar calificación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteRating,
    loading,
    error
  };
};

export const useUserRatingStats = (userId: string) => {
  const [stats, setStats] = useState({
    average_rating: 0,
    total_ratings: 0,
    rating_distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ratings.getUserStats(userId);
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const refetch = () => {
    fetchStats();
  };

  return { stats, loading, error, refetch };
};