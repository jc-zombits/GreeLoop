'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import Image from 'next/image';
import { useItem, useUpdateItem } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCategories';
import { Loading } from '@/components/ui/Loading';
import type { Item as FrontendItem } from '@/types';
 


const conditions = [
  'Nuevo',
  'Como nuevo',
  'Muy bueno',
  'Bueno',
  'Aceptable'
];


export default function EditItem() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const { item, loading, error } = useItem(itemId);
  const { categories, loading: categoriesLoading } = useCategories();
  const { updateItem, loading: updating } = useUpdateItem();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '', // category id
    condition: '',
    estimatedValue: '',
    location: '',
    tags: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  type BackendItem = {
    title: string;
    description: string;
    category_id?: string;
    condition: string;
    estimated_value?: number;
    location_description?: string;
    tags?: string[];
  };

  const isBackendItem = useCallback((obj: unknown): obj is BackendItem => {
    return !!obj && typeof (obj as BackendItem).title === 'string';
  }, []);

  useEffect(() => {
    if (item && categories.length) {
      let name = '';
      let description = '';
      let condition = '';
      let estimatedValueStr = '';
      let locationStr = '';
      let categoryId = '';
      let tagsStr = '';

      if (isBackendItem(item)) {
        name = item.title || '';
        description = item.description || '';
        condition = item.condition || '';
        estimatedValueStr = item.estimated_value !== undefined ? String(item.estimated_value) : '';
        locationStr = item.location_description || '';
        categoryId = item.category_id || '';
        tagsStr = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      } else {
        const fi = item as FrontendItem;
        name = fi.name || '';
        description = fi.description || '';
        condition = fi.condition || '';
        estimatedValueStr = fi.estimatedValue !== undefined ? String(fi.estimatedValue) : '';
        locationStr = fi.location || '';
        // Resolver id de categoría por nombre
        categoryId = categories.find(c => c.name === fi.category)?.id || '';
        tagsStr = Array.isArray(fi.tags) ? fi.tags.join(', ') : '';
      }

      setFormData({
        name,
        description,
        category: categoryId,
        condition,
        estimatedValue: estimatedValueStr,
        location: locationStr,
        tags: tagsStr,
      });
    }
  }, [item, categories, isBackendItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 5)); // Máximo 5 imágenes
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.condition) {
      newErrors.condition = 'La condición es requerida';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const payload: {
        title: string;
        description: string;
        category_id: string;
        condition: string;
        estimated_value?: number;
        location?: string;
      } = {
        title: formData.name.trim(),
        description: formData.description,
        category_id: formData.category,
        condition: formData.condition,
        estimated_value: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        location: formData.location || undefined,
      };
      await updateItem(itemId, payload);
      router.push('/items');
    } catch (error) {
      console.error('Error al actualizar el ítem:', error);
      // El error se maneja en el hook
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el ítem</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/items">
            <Button>Volver a mis ítems</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ítem no encontrado</h2>
          <p className="text-gray-600 mb-4">El ítem que intentas editar no existe o no tienes permisos para editarlo.</p>
          <Link href="/items">
            <Button>Volver a mis ítems</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/items/${itemId}`} className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al ítem
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Ítem</h1>
          <p className="mt-2 text-gray-600">
            Actualiza la información de tu ítem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Nombre del ítem *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Ej: Bicicleta de montaña Trek"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condición *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white ${
                    errors.condition ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona la condición</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600">{errors.condition}</p>
                )}
              </div>
              
              <div>
                <Input
                  label="Valor estimado (€) *"
                  name="estimatedValue"
                  type="number"
                  value={formData.estimatedValue}
                  onChange={handleInputChange}
                  error={errors.estimatedValue}
                  placeholder="Ej: 150"
                />
              </div>
              
              <div>
                <Input
                  label="Ubicación *"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  error={errors.location}
                  placeholder="Ej: Madrid, España"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 bg-white ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe tu ítem en detalle..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Etiquetas (separadas por comas)"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Ej: electrónico, apple, smartphone"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Imágenes</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG o GIF (MAX. 5 imágenes)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href={`/items/${itemId}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={updating}>
              {updating ? 'Actualizando...' : 'Actualizar Ítem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}