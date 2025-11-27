'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Globe, 
  Mic, 
  Trophy,
  BookOpen,
  ArrowRight,
  Search,
  Star,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'conferencia' | 'congreso' | 'reunion' | 'ponencia' | 'concurso' | 'exposicion' | 'seminario' | 'encuentro';
  date: string;
  time: string;
  location: string;
  isVirtual: boolean;
  organizer: string;
  capacity: number;
  registered: number;
  price: number;
  isFree: boolean;
  image?: string;
  tags: string[];
  rating?: number;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [locationFilter, setLocationFilter] = useState('todos');
  const [priceFilter, setPriceFilter] = useState('todos');
  const [loading, setLoading] = useState(true);



  const eventTypes = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'conferencia', label: 'Conferencias' },
    { value: 'congreso', label: 'Congresos' },
    { value: 'seminario', label: 'Seminarios' },
    { value: 'ponencia', label: 'Ponencias' },
    { value: 'exposicion', label: 'Exposiciones' },
    { value: 'concurso', label: 'Concursos' },
    { value: 'reunion', label: 'Reuniones' },
    { value: 'encuentro', label: 'Encuentros' }
  ];

  const getEventIcon = (type: string) => {
    const icons = {
      conferencia: Mic,
      congreso: Users,
      seminario: BookOpen,
      ponencia: Mic,
      exposicion: Globe,
      concurso: Trophy,
      reunion: Users,
      encuentro: Users
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      conferencia: 'bg-blue-500',
      congreso: 'bg-purple-500',
      seminario: 'bg-green-500',
      ponencia: 'bg-orange-500',
      exposicion: 'bg-pink-500',
      concurso: 'bg-yellow-500',
      reunion: 'bg-indigo-500',
      encuentro: 'bg-teal-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, isFree: boolean) => {
    if (isFree) return 'Gratuito';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  useEffect(() => {
    // Cargar eventos desde localStorage
    const loadEvents = () => {
      const savedEvents = JSON.parse(localStorage.getItem('greenloop_events') || '[]');
      setEvents(savedEvents);
      setFilteredEvents(savedEvents);
      setLoading(false);
    };

    // Simular carga de datos
    setTimeout(loadEvents, 500);

    // Escuchar cambios en localStorage para actualizar en tiempo real
    const handleStorageChange = () => {
      loadEvents();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados para actualizaciones inmediatas
    window.addEventListener('eventsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eventsUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Filtrar por ubicación
    if (locationFilter === 'virtual') {
      filtered = filtered.filter(event => event.isVirtual);
    } else if (locationFilter === 'presencial') {
      filtered = filtered.filter(event => !event.isVirtual);
    }

    // Filtrar por precio
    if (priceFilter === 'gratuito') {
      filtered = filtered.filter(event => event.isFree);
    } else if (priceFilter === 'pago') {
      filtered = filtered.filter(event => !event.isFree);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, typeFilter, locationFilter, priceFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <Calendar className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Eventos Sostenibles
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Conecta, aprende y participa en eventos que transforman el mundo hacia la sostenibilidad
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 py-3"
              >
                Explorar Eventos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/events/create">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-green-700 font-semibold px-8 py-3"
                >
                  Crear Evento
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-white text-gray-900 py-2">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="todos" className="bg-white text-gray-900 py-2">Todas las ubicaciones</option>
                <option value="virtual" className="bg-white text-gray-900 py-2">Virtual</option>
                <option value="presencial" className="bg-white text-gray-900 py-2">Presencial</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="todos" className="bg-white text-gray-900 py-2">Todos los precios</option>
                <option value="gratuito" className="bg-white text-gray-900 py-2">Gratuito</option>
                <option value="pago" className="bg-white text-gray-900 py-2">De pago</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Próximos Eventos ({filteredEvents.length})
          </h2>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              {events.length === 0 ? 'No hay eventos disponibles' : 'No se encontraron eventos'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {events.length === 0 
                ? 'Sé el primero en crear un evento para la comunidad GreenLoop.' 
                : 'Intenta ajustar los filtros para ver más resultados.'
              }
            </p>
            {events.length === 0 && (
              <Link href="/events/create">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3">
                  Crear Primer Evento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const IconComponent = getEventIcon(event.type);
              const availableSpots = event.capacity - event.registered;
              const isAlmostFull = availableSpots <= event.capacity * 0.1;
              
              return (
                <Card key={event.id} className="hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${getEventTypeColor(event.type)} rounded-lg p-3 text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        {event.rating && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {event.rating}
                          </div>
                        )}
                        <div className="text-sm font-medium text-green-600 mt-1">
                          {formatPrice(event.price, event.isFree)}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                      {event.description}
                    </p>
                    
                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(event.date)} - {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                        {event.isVirtual && (
                          <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Virtual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {event.registered}/{event.capacity} registrados
                        {isAlmostFull && (
                          <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            ¡Últimos cupos!
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Action Button */}
                    <div className="mt-auto">
                      <Link href={`/events/${event.id}`}>
                        <Button 
                          className="w-full group-hover:bg-green-600 transition-colors"
                          disabled={availableSpots === 0}
                        >
                          {availableSpots === 0 ? 'Agotado' : 'Ver Detalles'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Organizas eventos sostenibles?
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Únete a nuestra plataforma y conecta con una comunidad comprometida con la sostenibilidad
          </p>
          <Link href="/events/create">
            <Button 
              size="lg" 
              className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 py-3"
            >
              Publicar mi Evento
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;