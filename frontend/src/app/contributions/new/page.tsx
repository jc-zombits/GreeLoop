'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Calendar, MapPin, Package, DollarSign, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface ContributionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface ContributionForm {
  title: string;
  description: string;
  category_id: string;
  quantity: number;
  estimated_value: number;
  currency: string;
  destination: string;
  delivery_method: 'pickup' | 'delivery' | 'both';
  delivery_address: string;
  delivery_instructions: string;
  available_from: string;
  available_until: string;
  is_recurring: boolean;
  recurrence_pattern: string;
}

// Datos de ejemplo de categorías
const mockCategories: ContributionCategory[] = [
  { id: '1', name: 'Alimentos', description: 'Donaciones de comida', icon: '🍎', color: '#10B981', is_active: true },
  { id: '2', name: 'Ropa', description: 'Prendas de vestir', icon: '👕', color: '#3B82F6', is_active: true },
  { id: '3', name: 'Educación', description: 'Material educativo', icon: '📚', color: '#8B5CF6', is_active: true },
  { id: '4', name: 'Tecnología', description: 'Equipos tecnológicos', icon: '💻', color: '#F59E0B', is_active: true },
  { id: '5', name: 'Salud', description: 'Productos de salud', icon: '🏥', color: '#EF4444', is_active: true },
  { id: '6', name: 'Hogar', description: 'Artículos para el hogar', icon: '🏠', color: '#6B7280', is_active: true },
];

const currencies = [
  { value: 'COP', label: 'COP (Peso Colombiano)' },
  { value: 'USD', label: 'USD (Dólar Americano)' },
  { value: 'EUR', label: 'EUR (Euro)' },
];

const recurrenceOptions = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export default function NewContributionPage() {
  const { user, userType, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ContributionCategory[]>(mockCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ContributionForm>({
    title: '',
    description: '',
    category_id: '',
    quantity: 1,
    estimated_value: 0,
    currency: 'COP',
    destination: '',
    delivery_method: 'pickup',
    delivery_address: '',
    delivery_instructions: '',
    available_from: '',
    available_until: '',
    is_recurring: false,
    recurrence_pattern: 'monthly',
  });

  useEffect(() => {
    if (!loading) {
      if (!user || userType !== 'company') {
        router.push('/auth');
        return;
      }
      setIsLoading(false);
      
      // Establecer fecha mínima como hoy
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, available_from: today }));
    }
  }, [user, userType, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setForm(prev => ({ ...prev, [name]: newValue }));
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!form.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!form.category_id) {
      newErrors.category_id = 'Selecciona una categoría';
    }

    if (form.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (form.estimated_value < 0) {
      newErrors.estimated_value = 'El valor estimado no puede ser negativo';
    }

    if (!form.destination.trim()) {
      newErrors.destination = 'El destino es requerido';
    }

    if (!form.available_from) {
      newErrors.available_from = 'La fecha de disponibilidad es requerida';
    }

    if (form.delivery_method === 'delivery' && !form.delivery_address.trim()) {
      newErrors.delivery_address = 'La dirección de entrega es requerida para entregas a domicilio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Aquí harías la llamada a la API para crear la contribución
      console.log('Creating contribution:', form);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirigir a la lista de contribuciones
      router.push('/contributions');
    } catch (error) {
      console.error('Error creating contribution:', error);
      setErrors({ general: 'Error al crear la contribución. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/contributions" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a contribuciones
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Contribución</h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva contribución para ayudar a la comunidad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la contribución *
                </label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Donación de alimentos para familias necesitadas"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Describe detalladamente qué estás donando, en qué condiciones se encuentra, y cualquier información relevante..."
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-500 ${errors.category_id ? 'border-red-500' : ''}`}
                >
                  <option value="" className="text-gray-500">Selecciona una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="text-gray-600">
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  Destino/Beneficiario *
                </label>
                <Input
                  type="text"
                  id="destination"
                  name="destination"
                  value={form.destination}
                  onChange={handleInputChange}
                  placeholder="Ej: Fundación XYZ, Familias vulnerables, etc."
                  className={errors.destination ? 'border-red-500' : ''}
                />
                {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
              </div>
            </div>
          </div>

          {/* Detalles de la contribución */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-600" />
              Detalles de la Contribución
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={form.quantity}
                  onChange={handleInputChange}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor estimado
                </label>
                <Input
                  type="number"
                  id="estimated_value"
                  name="estimated_value"
                  min="0"
                  step="0.01"
                  value={form.estimated_value}
                  onChange={handleInputChange}
                  className={errors.estimated_value ? 'border-red-500' : ''}
                />
                {errors.estimated_value && <p className="text-red-500 text-sm mt-1">{errors.estimated_value}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={form.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value} className="text-gray-600">
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Entrega */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Método de Entrega
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Cómo se realizará la entrega? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center text-gray-600">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="pickup"
                      checked={form.delivery_method === 'pickup'}
                      onChange={handleInputChange}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    Recoger en nuestras instalaciones
                  </label>
                  <label className="flex items-center text-gray-600">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="delivery"
                      checked={form.delivery_method === 'delivery'}
                      onChange={handleInputChange}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    Entrega a domicilio
                  </label>
                  <label className="flex items-center text-gray-600">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="both"
                      checked={form.delivery_method === 'both'}
                      onChange={handleInputChange}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    Ambas opciones disponibles
                  </label>
                </div>
              </div>

              {(form.delivery_method === 'delivery' || form.delivery_method === 'both') && (
                <div>
                  <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección de entrega {form.delivery_method === 'delivery' ? '*' : '(opcional)'}
                  </label>
                  <Input
                    type="text"
                    id="delivery_address"
                    name="delivery_address"
                    value={form.delivery_address}
                    onChange={handleInputChange}
                    placeholder="Dirección completa donde se puede entregar"
                    className={errors.delivery_address ? 'border-red-500' : ''}
                  />
                  {errors.delivery_address && <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>}
                </div>
              )}

              <div>
                <label htmlFor="delivery_instructions" className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones de entrega (opcional)
                </label>
                <textarea
                  id="delivery_instructions"
                  name="delivery_instructions"
                  rows={3}
                  value={form.delivery_instructions}
                  onChange={handleInputChange}
                  placeholder="Instrucciones especiales, horarios de disponibilidad, contacto, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Disponibilidad
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="available_from" className="block text-sm font-medium text-gray-700 mb-2">
                  Disponible desde *
                </label>
                <Input
                  type="date"
                  id="available_from"
                  name="available_from"
                  value={form.available_from}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.available_from ? 'border-red-500' : ''}
                />
                {errors.available_from && <p className="text-red-500 text-sm mt-1">{errors.available_from}</p>}
              </div>

              <div>
                <label htmlFor="available_until" className="block text-sm font-medium text-gray-700 mb-2">
                  Disponible hasta (opcional)
                </label>
                <Input
                  type="date"
                  id="available_until"
                  name="available_until"
                  value={form.available_until}
                  onChange={handleInputChange}
                  min={form.available_from || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center text-gray-600">
                <input
                  type="checkbox"
                  name="is_recurring"
                  checked={form.is_recurring}
                  onChange={handleInputChange}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <Repeat className="h-4 w-4 mr-1" />
                Esta es una contribución recurrente
              </label>
              
              {form.is_recurring && (
                <div className="mt-4">
                  <label htmlFor="recurrence_pattern" className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia de recurrencia
                  </label>
                  <select
                    id="recurrence_pattern"
                    name="recurrence_pattern"
                    value={form.recurrence_pattern}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-500"
                  >
                    {recurrenceOptions.map(option => (
                      <option key={option.value} value={option.value} className="text-gray-600">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <Link href="/contributions">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Contribución
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}