'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Leaf, 
  Recycle, 
  Globe, 
  TrendingDown, 
  Users, 
  ArrowRight,
  Play,
  CheckCircle,
  Award,
  Target,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface ImpactStat {
  id: string;
  title: string;
  value: string;
  raw_value: number;
  icon: string;
  color: string;
}

interface EducationImpactResponse {
  impact_stats: ImpactStat[];
  additional_stats: {
    total_users: number;
    total_items: number;
    pending_exchanges: number;
    last_updated: string;
  };
}

const EducationPage: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollToModules = () => {
    const el = document.getElementById('modules');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Función para obtener el icono correspondiente
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'Leaf': TrendingDown,
      'Recycle': Recycle,
      'Users': Users,
      'Globe': Globe
    };
    return icons[iconName] || TrendingDown;
  };

  // Cargar estadísticas dinámicas
  useEffect(() => {
    const fetchImpactStats = async () => {
      try {
        setLoading(true);
        const data = await api.stats.getEducationImpact() as EducationImpactResponse;
        
        console.log('API Response:', data); // Debug log
        
        if (data && data.impact_stats && Array.isArray(data.impact_stats)) {
          setImpactStats(data.impact_stats);
          setError(null); // Limpiar cualquier error previo
        } else {
          console.warn('Invalid data structure:', data);
          throw new Error('Estructura de datos inválida');
        }
      } catch (err) {
        console.error('Error fetching impact stats:', err);
        setError('No se pudieron cargar las estadísticas. Mostrando datos de ejemplo.');
        
        // Fallback a datos estáticos en caso de error
        setImpactStats([
          { id: 'co2-saved', title: 'Toneladas de CO₂ evitadas', value: '2.3M', raw_value: 2300, icon: 'Leaf', color: 'green' },
          { id: 'objects-exchanged', title: 'Objetos intercambiados', value: '850K', raw_value: 850000, icon: 'Recycle', color: 'blue' },
          { id: 'users-educated', title: 'Usuarios educados', value: '45K', raw_value: 45000, icon: 'Users', color: 'purple' },
          { id: 'active-communities', title: 'Comunidades activas', value: '1.2K', raw_value: 1200, icon: 'Globe', color: 'orange' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchImpactStats();
  }, []);

  const modules = [
    {
      id: 'economia-circular',
      title: 'Economía Circular',
      description: 'Aprende los principios fundamentales de la economía circular y cómo aplicarlos en tu vida diaria.',
      icon: Recycle,
      duration: '45 min',
      level: 'Principiante',
      color: 'bg-green-500',
      topics: ['Reducir', 'Reutilizar', 'Reciclar', 'Intercambio sostenible']
    },
    {
      id: 'huella-carbono',
      title: 'Huella de Carbono',
      description: 'Descubre cómo calcular y reducir tu huella de carbono a través del intercambio responsable.',
      icon: Leaf,
      duration: '35 min',
      level: 'Intermedio',
      color: 'bg-blue-500',
      topics: ['Cálculo de emisiones', 'Reducción de CO₂', 'Impacto ambiental']
    },
    {
      id: 'consumo-responsable',
      title: 'Consumo Responsable',
      description: 'Estrategias para un consumo más consciente y sostenible en el día a día.',
      icon: Target,
      duration: '40 min',
      level: 'Principiante',
      color: 'bg-purple-500',
      topics: ['Compra consciente', 'Necesidad vs deseo', 'Alternativas sostenibles']
    },
    {
      id: 'energia-renovable',
      title: 'Energía Renovable',
      description: 'Conoce las fuentes de energía limpia y cómo implementarlas en tu hogar.',
      icon: BarChart3,
      duration: '50 min',
      level: 'Intermedio',
      color: 'bg-yellow-500',
      topics: ['Solar', 'Eólica', 'Eficiencia energética', 'Ahorro']
    },
    {
      id: 'biodiversidad',
      title: 'Biodiversidad y Ecosistemas',
      description: 'La importancia de proteger la biodiversidad y cómo nuestras acciones impactan los ecosistemas.',
      icon: Globe,
      duration: '55 min',
      level: 'Avanzado',
      color: 'bg-indigo-500',
      topics: ['Ecosistemas', 'Especies en peligro', 'Conservación', 'Impacto humano']
    },
    {
      id: 'comunidad-sostenible',
      title: 'Comunidad Sostenible',
      description: 'Cómo crear y participar en comunidades que promuevan la sostenibilidad.',
      icon: Users,
      duration: '40 min',
      level: 'Intermedio',
      color: 'bg-pink-500',
      topics: ['Colaboración', 'Iniciativas locales', 'Redes de intercambio']
    }
  ];

  const handleModuleComplete = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules([...completedModules, moduleId]);
    }
  };

  useEffect(() => {
    // Leer módulos completados desde localStorage
    try {
      const saved = localStorage.getItem('education_completed_modules');
      if (saved) {
        const arr = JSON.parse(saved) as string[];
        setCompletedModules(arr);
      }
    } catch (e) {
      // Ignorar errores de parsing
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <BookOpen className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Aprende con Nosotros
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Descubre cómo el intercambio sostenible puede transformar tu vida y el planeta
            </p>
            <Button 
              size="lg" 
              className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 py-3"
              onClick={scrollToModules}
            >
              Comenzar Aprendizaje
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Impact Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestro Impacto Global
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Juntos estamos creando un cambio real y medible
            </p>
            {error && (
              <p className="text-sm text-amber-600 mt-2">
                {error}
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {impactStats.map((stat) => {
                const IconComponent = getIcon(stat.icon);
                return (
                  <Card key={stat.id} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-green-100 rounded-full p-3">
                          <IconComponent className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stat.title}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Learning Modules Section */}
      <div className="py-16 bg-gray-50" id="modules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Módulos de Aprendizaje
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Contenido estructurado para convertirte en un experto en sostenibilidad
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => {
              const isCompleted = completedModules.includes(module.id);
              const IconComponent = module.icon;
              
              return (
                <Card key={module.id} className="hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${module.color} rounded-lg p-3 text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {module.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        {module.duration}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {module.level}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4 flex-1">
                      {module.topics.slice(0, 3).map((topic, index) => (
                        <span 
                          key={index}
                          className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs h-fit"
                        >
                          {topic}
                        </span>
                      ))}
                      {module.topics.length > 3 && (
                        <span className="text-gray-400 text-xs px-2 py-1 h-fit">
                          +{module.topics.length - 3} más
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <Link href={`/education/modules/${module.id}`}>
                        <Button 
                          className="w-full group-hover:bg-green-600 transition-colors"
                          variant={isCompleted ? "outline" : "primary"}
                        >
                          {isCompleted ? 'Revisar' : 'Comenzar'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 rounded-full p-4">
                <Award className="h-12 w-12 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Obtén tu Certificación
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Completa todos los módulos y recibe tu certificado oficial en Sostenibilidad y Economía Circular
            </p>
            <div className="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {completedModules.length} / {modules.length}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Módulos completados
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedModules.length / modules.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationPage;
