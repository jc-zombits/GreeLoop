'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Tag,
  Save,
  Eye
} from 'lucide-react';

interface EventFormData {
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location: string;
  isVirtual: boolean;
  organizer: string;
  capacity: number | string;
  price: number;
  isFree: boolean;
  tags: string[];
}

const eventTypes = [
  { value: 'conferencia', label: 'Conferencia' },
  { value: 'congreso', label: 'Congreso' },
  { value: 'seminario', label: 'Seminario' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'ponencia', label: 'Ponencia' },
  { value: 'concurso', label: 'Concurso' },
  { value: 'exposicion', label: 'Exposición' },
  { value: 'encuentro', label: 'Encuentro' }
];

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'conferencia',
    date: '',
    time: '',
    location: '',
    isVirtual: false,
    organizer: '',
    capacity: 50,
    price: 0,
    isFree: true,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field: keyof EventFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Crear el nuevo evento
      const newEvent = {
        id: Date.now().toString(),
        ...formData,
        capacity: typeof formData.capacity === 'string' ? parseInt(formData.capacity) || 0 : formData.capacity,
        registered: 0,
        rating: 0
      };

      // Guardar en localStorage por ahora (más tarde se conectará con el backend)
      const existingEvents = JSON.parse(localStorage.getItem('greenloop_events') || '[]');
      const updatedEvents = [newEvent, ...existingEvents];
      localStorage.setItem('greenloop_events', JSON.stringify(updatedEvents));

      // Disparar evento personalizado para actualizar la lista inmediatamente
      window.dispatchEvent(new CustomEvent('eventsUpdated'));

      // Redirigir a la página de eventos
      router.push('/events?created=true');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Evento</h1>
                <p className="text-gray-600">Comparte tu evento con la comunidad GreenLoop</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/events')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Evento *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: Conferencia Internacional de Sostenibilidad 2024"
                  required
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe tu evento, qué aprenderán los asistentes, qué incluye..."
                  required
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium"
                  required
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organizador *
                </label>
                <Input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                  placeholder="Nombre del organizador o empresa"
                  required
                />
              </div>
            </div>
          </div>

          {/* Fecha y Ubicación */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Fecha y Ubicación
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventLocation"
                      checked={!formData.isVirtual}
                      onChange={() => handleInputChange('isVirtual', false)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-900 font-medium">Presencial</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventLocation"
                      checked={formData.isVirtual}
                      onChange={() => handleInputChange('isVirtual', true)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-900 font-medium">Virtual</span>
                  </label>
                </div>
                
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={formData.isVirtual ? "Enlace de la reunión virtual" : "Dirección del evento"}
                  required
                />
              </div>
            </div>
          </div>

          {/* Capacidad y Precio */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Capacidad y Precio
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad Máxima *
                </label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleInputChange('capacity', '');
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange('capacity', numValue);
                      }
                    }
                  }}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Evento *
                </label>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="eventPrice"
                      checked={formData.isFree}
                      onChange={() => {
                        handleInputChange('isFree', true);
                        handleInputChange('price', 0);
                      }}
                      className="mr-3 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-gray-900 font-medium">Gratuito</span>
                      <p className="text-sm text-gray-500">Sin costo para los participantes</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="eventPrice"
                      checked={!formData.isFree}
                      onChange={() => handleInputChange('isFree', false)}
                      className="mr-3 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-gray-900 font-medium">De pago</span>
                      <p className="text-sm text-gray-500">Requiere pago para participar</p>
                    </div>
                  </label>
                </div>
                
                {!formData.isFree && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio *
                    </label>
                    <div className="flex">
                      <select className="px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="COP">COP</option>
                        <option value="USD">USD</option>
                      </select>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="rounded-l-none border-l-0 flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-green-600" />
              Etiquetas
            </h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Agregar etiqueta"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Agregar
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Publicar Evento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}