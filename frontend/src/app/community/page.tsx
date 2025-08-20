'use client';

import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, TrendingUp, Award, MapPin, Calendar, Star, Heart, Plus, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface AuthUser {
  name: string;
  avatar: string;
}

interface ApiPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    location: string;
  };
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  post_type: 'success_story' | 'tip' | 'general';
}

// Simulamos el estado de autenticación - en una app real esto vendría del contexto de auth
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // En una app real, aquí decodificarías el token para obtener la info del usuario
      setUser({ name: 'Usuario Actual', avatar: '/api/placeholder/40/40' });
    }
  }, []);
  
  return { isAuthenticated, user };
};

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

interface ApiUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  total_exchanges: number;
  rating: number;
  join_date: string;
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
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de crear post
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'general' as 'success_story' | 'tip' | 'general',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas de la comunidad desde la API
        const statsResponse = await fetch('http://localhost:8000/api/v1/community/stats');
        if (!statsResponse.ok) {
          throw new Error('Error al obtener estadísticas de la comunidad');
        }
        const statsData = await statsResponse.json();
        
        const communityStats: CommunityStats = {
          totalUsers: statsData.total_users,
          totalExchanges: statsData.total_exchanges,
          itemsSaved: statsData.items_saved,
          co2Reduced: statsData.co2_reduced
        };

        // Obtener usuarios destacados desde la API
        const usersResponse = await fetch('http://localhost:8000/api/v1/community/top-users?limit=10');
        if (!usersResponse.ok) {
          throw new Error('Error al obtener usuarios destacados');
        }
        const usersData = await usersResponse.json();
        
        const topUsers: TopUser[] = usersData.users.map((user: ApiUser) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          location: user.location,
          totalExchanges: user.total_exchanges,
          rating: user.rating,
          joinDate: user.join_date
        }));

        // Obtener posts de la comunidad desde la API
        const postsResponse = await fetch('http://localhost:8000/api/v1/community/posts?page=1&limit=10');
        let communityPosts: CommunityPost[] = [];
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          communityPosts = postsData.posts.map((post: ApiPost) => ({
            id: post.id,
            author: {
              name: post.author.name,
              avatar: post.author.avatar,
              location: post.author.location
            },
            content: post.content,
            image: post.image_url,
            likes: post.likes_count,
            comments: post.comments_count,
            createdAt: post.created_at,
            type: post.post_type
          }));
        } else {
          console.warn('No se pudieron cargar los posts de la comunidad');
        }
        
        setStats(communityStats);
        setTopUsers(topUsers);
        setCommunityPosts(communityPosts);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });
      
      if (response.ok) {
        const result = await response.json();
        // Agregar el nuevo post al inicio de la lista
        const newPostData: CommunityPost = {
          id: result.post.id,
          author: {
            name: result.post.author.name,
            avatar: result.post.author.avatar,
            location: result.post.author.location
          },
          content: result.post.content,
          image: result.post.image_url,
          likes: result.post.likes_count,
          comments: result.post.comments_count,
          createdAt: result.post.created_at,
          type: result.post.post_type
        };
        
        setCommunityPosts(prev => [newPostData, ...prev]);
        
        // Resetear formulario
        setNewPost({
          title: '',
          content: '',
          post_type: 'general',
          image_url: ''
        });
        setShowCreateForm(false);
      } else {
        console.error('Error al crear el post');
        alert('Error al crear el post. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear el post. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Create Post Section */}
        {isAuthenticated && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Comparte con la comunidad</CardTitle>
                    <CardDescription>Cuenta tu experiencia, comparte consejos o inicia una conversación</CardDescription>
                  </div>
                  {!showCreateForm && (
                    <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Crear post</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showCreateForm && (
                <CardContent>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título (opcional)
                      </label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Título de tu publicación..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido *
                      </label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="¿Qué quieres compartir con la comunidad?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de publicación
                      </label>
                      <select
                        value={newPost.post_type}
                        onChange={(e) => setNewPost(prev => ({ ...prev, post_type: e.target.value as 'success_story' | 'tip' | 'general' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="general">General</option>
                        <option value="tip">Consejo</option>
                        <option value="success_story">Historia de éxito</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL de imagen (opcional)
                      </label>
                      <input
                        type="url"
                        value={newPost.image_url}
                        onChange={(e) => setNewPost(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !newPost.content.trim()}
                        className="flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>{isSubmitting ? 'Publicando...' : 'Publicar'}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPost({ title: '', content: '', post_type: 'general', image_url: '' });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Community Posts */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Actividad de la Comunidad</h2>
                  <p className="text-gray-600">Descubre las últimas historias y consejos de nuestra comunidad</p>
                </div>
                {isAuthenticated && (
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear Post</span>
                  </Button>
                )}
              </div>
              
              {/* Formulario para crear post */}
              {showCreateForm && isAuthenticated && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Crear nueva publicación</CardTitle>
                    <CardDescription>
                      Comparte tu experiencia, consejos o ideas con la comunidad
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título (opcional)
                        </label>
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Título de tu publicación..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contenido *
                        </label>
                        <textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="¿Qué quieres compartir con la comunidad?"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de publicación
                        </label>
                        <select
                          value={newPost.post_type}
                          onChange={(e) => setNewPost(prev => ({ ...prev, post_type: e.target.value as 'success_story' | 'tip' | 'general' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="general">General</option>
                          <option value="tip">Consejo</option>
                          <option value="success_story">Historia de éxito</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL de imagen (opcional)
                        </label>
                        <input
                          type="url"
                          value={newPost.image_url}
                          onChange={(e) => setNewPost(prev => ({ ...prev, image_url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          type="submit"
                          disabled={isSubmitting || !newPost.content.trim()}
                          className="flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          <span>{isSubmitting ? 'Publicando...' : 'Publicar'}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateForm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
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
                <Link href="/auth?mode=register">
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