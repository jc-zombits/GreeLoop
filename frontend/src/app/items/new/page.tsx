'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import Image from 'next/image';
import { useCreateItem } from '@/hooks/useItems';
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

export default function NewItem() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();
  const { createItem, loading: creating } = useCreateItem();
  
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

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

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
    if (files.length + images.length > 5) {
      alert('Máximo 5 imágenes permitidas');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'El título es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.category_id) newErrors.category_id = 'La categoría es requerida';
    if (!formData.condition) newErrors.condition = 'El estado es requerido';
    if (!formData.location.trim()) newErrors.location = 'La ubicación es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await createItem({
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      }, images);
      
      router.push('/items');
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/items" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis items
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Publicar Nuevo Item</h1>
          <p className="mt-2 text-gray-600">
            Completa la información de tu item para ponerlo disponible para intercambio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Título del item *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="Ej: Bicicleta de montaña Trek"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.category_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecciona el estado</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition}</p>}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe tu item, su estado, características especiales, etc."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Adicional</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Valor estimado (opcional)"
                name="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={handleInputChange}
                placeholder="Ej: 150"
                helperText="Ayuda a otros usuarios a evaluar el intercambio"
              />
              
              <Input
                label="Ubicación *"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                error={errors.location}
                placeholder="Ej: Madrid, Centro"
              />
              
              <div className="md:col-span-2">
                <Input
                  label="Etiquetas (opcional)"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Ej: vintage, colección, limitado"
                  helperText="Separa las etiquetas con comas"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Imágenes</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Sube hasta 5 imágenes
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF hasta 10MB cada una
                    </span>
                  </label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        width={96}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg"
                      />
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
          <div className="flex gap-4">
            <Link href="/items" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={creating}
              className="flex-1"
            >
              {creating ? 'Publicando...' : 'Publicar Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}