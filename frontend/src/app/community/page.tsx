'use client';

import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, TrendingUp, Award, MapPin, Calendar, Star, Heart, Plus, Send, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/constants';

interface AuthUser {
  name: string;
  avatar: string;
}

type PostType = 'success_story' | 'tip' | 'general';
type MediaType = 'none' | 'image' | 'video';

interface FeedAuthor {
  id: string;
  actor_type: 'user' | 'company';
  name: string;
  username: string;
  avatar: string;
  location: string;
}

interface FeedPost {
  id: string;
  title?: string | null;
  content: string;
  post_type: PostType;
  media_type: MediaType;
  media_url?: string | null;
  author: FeedAuthor;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  is_liked: boolean;
}

interface FeedComment {
  id: string;
  post_id: string;
  author: FeedAuthor;
  content: string;
  created_at: string;
}

// Simulamos el estado de autenticación - en una app real esto vendría del contexto de auth
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  
  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      // En una app real, aquí decodificarías el token para obtener la info del usuario
      setUser({ name: 'Usuario Actual', avatar: '/api/placeholder/40/40' });
      
      // Verificar si ya es miembro de la comunidad
      const communityMembership = localStorage.getItem('communityMember');
      setIsCommunityMember(communityMembership === 'true');
    }
  }, []);
  
  const joinCommunity = () => {
    setIsCommunityMember(true);
    localStorage.setItem('communityMember', 'true');
  };
  
  return { isAuthenticated, user, isCommunityMember, joinCommunity };
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

const CommunityPage: React.FC = () => {
  const { isAuthenticated, isCommunityMember, joinCommunity } = useAuth();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de crear post
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'general' as PostType,
    media_type: 'none' as MediaType,
    media_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, FeedComment[]>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas de la comunidad desde la API
        const statsResponse = await fetch(`${API_BASE_URL}/api/v1/community/stats`);
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
        const usersResponse = await fetch(`${API_BASE_URL}/api/v1/community/top-users?limit=10`);
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

        const token = localStorage.getItem('access_token');
        const postsResponse = await fetch(`${API_BASE_URL}/api/v1/community/feed?page=1&page_size=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        let communityPosts: FeedPost[] = [];

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          communityPosts = postsData.posts as FeedPost[];
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/community/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPost.title || null,
          content: newPost.content,
          post_type: newPost.post_type,
          media_type: newPost.media_type,
          media_url: newPost.media_type === 'none' ? null : (newPost.media_url || null)
        })
      });
      
      if (response.ok) {
        const created = (await response.json()) as FeedPost;
        setCommunityPosts(prev => [created, ...prev]);
        
        // Resetear formulario
        setNewPost({
          title: '',
          content: '',
          post_type: 'general',
          media_type: 'none',
          media_url: ''
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

  const toggleLike = async (postId: string) => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/community/feed/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = (await res.json()) as { liked: boolean; likes_count: number };
      setCommunityPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, is_liked: data.liked, likes_count: data.likes_count } : p
        )
      );
    } catch {
    }
  };

  const sharePost = async (postId: string) => {
    const url = `${window.location.origin}/community#post-${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/community/feed/${postId}/share`, { method: 'POST' });
      if (!res.ok) return;
      const data = (await res.json()) as { shares_count: number };
      setCommunityPosts(prev => prev.map(p => (p.id === postId ? { ...p, shares_count: data.shares_count } : p)));
    } catch {
    }
  };

  const toggleComments = async (postId: string) => {
    const next = expandedPostId === postId ? null : postId;
    setExpandedPostId(next);
    if (!next) return;
    if (commentsByPostId[next]) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/community/feed/${postId}/comments?page=1&page_size=50`);
      if (!res.ok) return;
      const data = (await res.json()) as { comments: FeedComment[] };
      setCommentsByPostId(prev => ({ ...prev, [postId]: data.comments || [] }));
    } catch {
    }
  };

  const submitComment = async (postId: string) => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const content = (commentDraftByPostId[postId] || '').trim();
    if (!content) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/community/feed/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) return;
      const created = (await res.json()) as FeedComment;
      setCommentsByPostId(prev => ({ ...prev, [postId]: [...(prev[postId] || []), created] }));
      setCommentDraftByPostId(prev => ({ ...prev, [postId]: '' }));
      setCommunityPosts(prev => prev.map(p => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
    } catch {
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
                        onChange={(e) => setNewPost(prev => ({ ...prev, post_type: e.target.value as PostType }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="general">General</option>
                        <option value="tip">Consejo</option>
                        <option value="success_story">Historia de éxito</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adjunto (opcional)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select
                          value={newPost.media_type}
                          onChange={(e) =>
                            setNewPost(prev => ({
                              ...prev,
                              media_type: e.target.value as MediaType,
                              media_url: e.target.value === 'none' ? '' : prev.media_url
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="none">Sin adjunto</option>
                          <option value="image">Imagen (URL)</option>
                          <option value="video">Video (URL)</option>
                        </select>
                        <input
                          type="url"
                          value={newPost.media_url}
                          onChange={(e) => setNewPost(prev => ({ ...prev, media_url: e.target.value }))}
                          className="sm:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={
                            newPost.media_type === 'video'
                              ? 'https://ejemplo.com/video.mp4'
                              : 'https://ejemplo.com/imagen.jpg'
                          }
                          disabled={newPost.media_type === 'none'}
                        />
                      </div>
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
                          setNewPost({ title: '', content: '', post_type: 'general', media_type: 'none', media_url: '' });
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
              </div>
            </div>

            <div className="space-y-6">
              {communityPosts.map((post) => (
                <Card key={post.id} id={`post-${post.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {post.author.name}{' '}
                            <span className="text-gray-500 font-normal">@{post.author.username}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.author.location}
                            <span className="mx-2">•</span>
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {getPostTypeIcon(post.post_type)}
                        <span>{getPostTypeLabel(post.post_type)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {post.title ? <div className="font-semibold text-gray-900 mb-2">{post.title}</div> : null}
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                    {post.media_type === 'image' && post.media_url ? (
                      <img
                        src={post.media_url}
                        alt="Imagen del post"
                        className="w-full h-60 object-cover rounded-lg mb-4"
                        loading="lazy"
                      />
                    ) : null}

                    {post.media_type === 'video' && post.media_url ? (
                      <video className="w-full rounded-lg mb-4" controls preload="metadata" src={post.media_url} />
                    ) : null}

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <button
                        type="button"
                        className={`flex items-center space-x-1 ${post.is_liked ? 'text-red-600' : 'hover:text-red-600'}`}
                        onClick={() => toggleLike(post.id)}
                        disabled={!isAuthenticated}
                      >
                        <Heart className="h-4 w-4" />
                        <span>{post.likes_count}</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center space-x-1 hover:text-blue-600"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments_count}</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center space-x-1 hover:text-gray-900"
                        onClick={() => sharePost(post.id)}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares_count}</span>
                      </button>
                    </div>

                    {expandedPostId === post.id ? (
                      <div className="mt-5 border-t border-gray-200 pt-4 space-y-4">
                        <div className="space-y-3">
                          {(commentsByPostId[post.id] || []).map((c) => (
                            <div key={c.id} className="flex items-start gap-3">
                              <img src={c.author.avatar} alt={c.author.name} className="h-8 w-8 rounded-full object-cover" />
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  <span className="font-semibold">{c.author.name}</span>{' '}
                                  <span className="text-gray-500">@{c.author.username}</span>
                                  <span className="text-gray-400"> · {new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {isAuthenticated ? (
                          <div className="flex items-start gap-3">
                            <textarea
                              rows={2}
                              value={commentDraftByPostId[post.id] || ''}
                              onChange={(e) =>
                                setCommentDraftByPostId((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Escribe un comentario..."
                            />
                            <Button
                              type="button"
                              onClick={() => submitComment(post.id)}
                              disabled={!(commentDraftByPostId[post.id] || '').trim()}
                              className="flex items-center space-x-2"
                            >
                              <Send className="h-4 w-4" />
                              <span>Enviar</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Inicia sesión para comentar.
                          </div>
                        )}
                      </div>
                    ) : null}
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
                          className="h-12 w-12 rounded-full object-cover"
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
                {isAuthenticated ? (
                  isCommunityMember ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¡Ya eres parte de la comunidad!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Gracias por ser parte activa de nuestra comunidad sostenible. Sigue compartiendo y aprendiendo.
                      </p>
                      <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                        <Star className="h-4 w-4 mr-2" />
                        Miembro activo
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¡Únete a la comunidad!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Forma parte activa de nuestra comunidad sostenible y comparte tus experiencias.
                      </p>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={joinCommunity}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Unirme a la comunidad
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Únete a la comunidad!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crea tu cuenta gratuita para formar parte de una comunidad comprometida con la sostenibilidad.
                    </p>
                    <Link href="/auth?mode=register">
                      <Button className="w-full">
                        Crear cuenta gratis
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
