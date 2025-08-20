import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: Category[] = await api.items.getCategories();
        setCategories(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar categorías');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};