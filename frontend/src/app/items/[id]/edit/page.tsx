'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Item, ItemCondition, ItemStatus } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useItem, useUpdateItem } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCategories';
import { Loading } from '@/components/ui/Loading';

const categories = [
  'Electrónicos',
  'Hogar y Jardín',
  'Libros y Educación',
  'Deportes y Ocio',
  'Ropa y Accesorios',
  'Vehículos',
  'Salud y Belleza',
  'Herramientas',
  'Música e Instrumentos'
];

const conditions = [
  'Nuevo',
  'Como nuevo',
  'Muy bueno',
  'Bueno',
  'Aceptable'
];

// Mock data - en una aplicación real, esto vendría de una API
const mockItems: Item[] = [
  {
    id: '1',
    name: 'Bicicleta de montaña Trek',
    description: 'Bicicleta Trek en excelente estado, ideal para montaña y senderos. Incluye casco y luces.',
    category: 'Deportes y Ocio',
    condition: 'Muy bueno' as ItemCondition,
    estimatedValue: 450,
    location: 'Madrid, España',
    tags: ['bicicleta', 'trek', 'montaña', 'deportes'],
    status: 'Disponible' as ItemStatus,
    views: 24,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    ownerId: '1',
    images: ['/items/bike1.jpg', '/items/bike2.jpg'],
    likes: 5,
    owner: {
      id: '1',
      name: 'Ana García',
      email: 'ana@example.com',
      location: 'Madrid, España',
      avatar: '/avatars/ana.jpg',
      joinDate: '2023-01-01',
      rating: 4.8,
      totalExchanges: 12,
      isVerified: true
    }
  },
  {
    id: '2',
    name: 'MacBook Pro 13" 2020',
    description: 'MacBook Pro en perfecto estado, usado principalmente para trabajo de oficina. Incluye cargador original.',
    category: 'Electrónicos',
    condition: 'Como nuevo' as ItemCondition,
    estimatedValue: 1200,
    location: 'Barcelona, España',
    tags: ['macbook', 'apple', 'laptop', 'ordenador'],
    status: 'Disponible' as ItemStatus,
    views: 89,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
    ownerId: '2',
    images: ['/items/macbook1.jpg'],
    likes: 12,
    owner: {
      id: '2',
      name: 'Carlos Ruiz',
      email: 'carlos@example.com',
      location: 'Barcelona, España',
      avatar: '/avatars/carlos.jpg',
      joinDate: '2023-02-15',
      rating: 4.9,
      totalExchanges: 8,
      isVerified: true
    }
  },
  {
    id: '3',
    name: 'Colección de libros de programación',
    description: 'Colección de 15 libros sobre programación en diferentes lenguajes. Perfectos para estudiantes.',
    category: 'Libros y Educación',
    condition: 'Bueno' as ItemCondition,
    estimatedValue: 180,
    location: 'Valencia, España',
    tags: ['libros', 'programación', 'educación', 'código'],
    status: 'Disponible' as ItemStatus,
    views: 45,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
    ownerId: '1',
    images: ['/items/books1.jpg', '/items/books2.jpg', '/items/books3.jpg'],
    likes: 8,
    owner: {
      id: '1',
      name: 'Ana García',
      email: 'ana@example.com',
      location: 'Madrid, España',
      avatar: '/avatars/ana.jpg',
      joinDate: '2023-01-01',
      rating: 4.8,
      totalExchanges: 12,
      isVerified: true
    }
  }
];

export default function EditItem() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const { item, loading, error } = useItem(itemId);
  const { categories, loading: categoriesLoading } = useCategories();
  const { updateItem, loading: updating } = useUpdateItem();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    condition: '',
    estimated_value: '',
    location: '',
    tags: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        category_id: item.category_id?.toString() || '',
        condition: item.condition,
        estimated_value: item.estimated_value?.toString() || '',
        location: item.location,
        tags: item.tags?.join(', ') || ''
      });
    }
  }, [item]);

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

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'La categoría es requerida';
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
      const itemData = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      await updateItem(itemId, itemData, images);
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
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar Ítem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}