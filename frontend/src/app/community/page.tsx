'use client';

import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, TrendingUp, Award, MapPin, Calendar, Star, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface CommunityStats {
  totalUsers: number;
  totalExchanges: number;
  itemsSaved: number;
  co2Reduced: number;
}

interface TopUser {
  id: string;
  name: string;
  avatar: string;
  location: string;
  totalExchanges: number;
  rating: number;
  joinDate: string;
}

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    location: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  createdAt: string;
  type: 'success_story' | 'tip' | 'general';
}

const CommunityPage: React.FC = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        // Datos de demostración
        const mockStats: CommunityStats = {
          totalUsers: 12547,
          totalExchanges: 8932,
          itemsSaved: 15678,
          co2Reduced: 2340
        };

        const mockTopUsers: TopUser[] = [
          {
            id: '1',
            name: 'Ana García',
            avatar: '/api/placeholder/60/60',
            location: 'Madrid, España',
            totalExchanges: 47,
            rating: 4.9,
            joinDate: '2023-03-15'
          },
          {
            id: '2',
            name: 'Carlos Rodríguez',
            avatar: '/api/placeholder/60/60',
            location: 'Barcelona, España',
            totalExchanges: 42,
            rating: 4.8,
            joinDate: '2023-02-20'
          },
          {
            id: '3',
            name: 'María López',
            avatar: '/api/placeholder/60/60',
            location: 'Valencia, España',
            totalExchanges: 38,
            rating: 4.9,
            joinDate: '2023-04-10'
          },
          {
            id: '4',
            name: 'Luis Martín',
            avatar: '/api/placeholder/60/60',
            location: 'Sevilla, España',
            totalExchanges: 35,
            rating: 4.7,
            joinDate: '2023-01-25'
          }
        ];

        const mockPosts: CommunityPost[] = [
          {
            id: '1',
            author: {
              name: 'Ana García',
              avatar: '/api/placeholder/40/40',
              location: 'Madrid'
            },
            content: '¡Increíble intercambio! Cambié mi bicicleta vieja por una guitarra acústica perfecta. La comunidad de GreenLoop es fantástica. 🎸🚲',
            image: '/api/placeholder/400/200',
            likes: 24,
            comments: 8,
            createdAt: '2024-01-15T10:30:00Z',
            type: 'success_story'
          },
          {
            id: '2',
            author: {
              name: 'Carlos Rodríguez',
              avatar: '/api/placeholder/40/40',
              location: 'Barcelona'
            },
            content: 'Consejo: Siempre toma fotos desde múltiples ángulos cuando publiques un item. Ayuda mucho a generar confianza con otros usuarios. 📸',
            likes: 18,
            comments: 5,
            createdAt: '2024-01-14T15:45:00Z',
            type: 'tip'
          },
          {
            id: '3',
            author: {
              name: 'María López',
              avatar: '/api/placeholder/40/40',
              location: 'Valencia'
            },
            content: 'Después de 6 meses en GreenLoop, he intercambiado 15 items y conocido personas increíbles. ¡Esta plataforma cambió mi forma de consumir! 🌱',
            likes: 31,
            comments: 12,
            createdAt: '2024-01-13T09:20:00Z',
            type: 'success_story'
          },
          {
            id: '4',
            author: {
              name: 'Luis Martín',
              avatar: '/api/placeholder/40/40',
              location: 'Sevilla'
            },
            content: '¿Alguien más piensa que deberíamos organizar un evento de intercambio presencial en cada ciudad? Sería genial conocernos en persona.',
            likes: 15,
            comments: 9,
            createdAt: '2024-01-12T18:10:00Z',
            type: 'general'
          }
        ];
        
        setStats(mockStats);
        setTopUsers(mockTopUsers);
        setCommunityPosts(mockPosts);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'success_story':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'tip':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'success_story':
        return 'Historia de éxito';
      case 'tip':
        return 'Consejo';
      default:
        return 'General';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando comunidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nuestra Comunidad
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Únete a miles de personas que están construyendo un futuro más sostenible 
              a través del intercambio responsable.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Community Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</div>
                <div className="text-sm text-gray-600">Usuarios activos</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalExchanges)}</div>
                <div className="text-sm text-gray-600">Intercambios realizados</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.itemsSaved)}</div>
                <div className="text-sm text-gray-600">Items salvados</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.co2Reduced}kg</div>
                <div className="text-sm text-gray-600">CO₂ reducido</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Community Posts */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Actividad de la Comunidad</h2>
              <p className="text-gray-600">Descubre las últimas historias y consejos de nuestra comunidad</p>
            </div>

            <div className="space-y-6">
              {communityPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{post.author.name}</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.author.location}
                            <span className="mx-2">•</span>
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {getPostTypeIcon(post.type)}
                        <span>{getPostTypeLabel(post.type)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post image"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <button className="flex items-center space-x-1 hover:text-red-600">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Users Sidebar */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Usuarios Destacados</h2>
              <p className="text-gray-600">Los miembros más activos de nuestra comunidad</p>
            </div>

            <div className="space-y-4">
              {topUsers.map((user, index) => (
                <Card key={user.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {user.location}
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-green-600 font-medium">
                            {user.totalExchanges} intercambios
                          </span>
                          <div className="flex items-center text-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            {user.rating}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Join Community CTA */}
            <Card className="mt-8 bg-green-50 border-green-200">
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Únete a la comunidad!
                </h3>
                <p className="text-gray-600 mb-4">
                  Forma parte de una comunidad comprometida con la sostenibilidad.
                </p>
                <Link href="/auth">
                  <Button className="w-full">
                    Crear cuenta gratis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;