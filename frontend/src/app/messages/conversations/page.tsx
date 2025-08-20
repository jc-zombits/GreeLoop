'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageCircle, Plus, User, Clock, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Conversation {
  id: string;
  otherUser: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
  exchangeInfo?: {
    id: number;
    status: string;
    itemName: string;
  };
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [foundUsers, setFoundUsers] = useState<{
    id: number;
    name: string;
    username: string;
    email: string;
    isOnline: boolean;
  }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [currentUserId] = useState(1); // Simular usuario actual

  useEffect(() => {
    const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Obtener conversaciones reales de la API
      const response = await fetch('/api/v1/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener conversaciones');
      }
      
      const data = await response.json();
      
      // Convertir datos de la API al formato esperado
      const apiConversations: Conversation[] = data.conversations.map((conv: any) => ({
        id: conv.id,
        otherUser: {
          id: conv.other_user.id,
          name: conv.other_user.name,
          username: conv.other_user.username,
          avatar: conv.other_user.avatar || '/api/placeholder/40/40',
          isOnline: conv.other_user.is_online || false
        },
        lastMessage: {
          content: conv.last_message.content,
          createdAt: conv.last_message.created_at,
          senderId: conv.last_message.sender_id
        },
        unreadCount: conv.unread_count || 0,
        exchangeInfo: conv.exchange_info ? {
          id: conv.exchange_info.id,
          status: conv.exchange_info.status,
          itemName: conv.exchange_info.item_name
        } : undefined
      }));
        
        setConversations(apiConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Función para buscar usuarios
  const searchForUsers = async (query: string) => {
    if (!query.trim()) {
      setFoundUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      // Buscar usuarios reales en la API
       const response = await fetch(`/api/v1/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al buscar usuarios');
      }
      
      const data = await response.json();
      
      // Convertir datos de la API al formato esperado
      const apiUsers = data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar || '/api/placeholder/40/40',
        isOnline: user.is_online || false
      }));

      setFoundUsers(apiUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Función para iniciar un nuevo chat
  const startNewChat = async (userId: number) => {
    try {
      // Verificar si ya existe una conversación con este usuario
      const existingConv = conversations.find(conv => conv.otherUser.id === userId);
      
      if (existingConv) {
        // Si ya existe, ir directamente al chat
        router.push(`/messages/chat?user_id=${userId}`);
      } else {
        // Si no existe, crear una nueva conversación
        const response = await fetch('/api/v1/messages/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ other_user_id: userId })
        });
        
        if (!response.ok) {
          throw new Error('Error al crear conversación');
        }
        
        // Ir al chat
        router.push(`/messages/chat?user_id=${userId}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setShowNewChatModal(false);
    }
  };

  // Efecto para buscar usuarios cuando cambia el texto de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchForUsers(searchUsers);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchUsers]);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-gray-600 mt-1">
                {totalUnread > 0 ? `${totalUnread} mensajes sin leer` : 'Todas las conversaciones al día'}
              </p>
            </div>
            <Button
              onClick={() => setShowNewChatModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center space-x-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Nuevo Chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : 'Inicia una conversación con otros usuarios de la comunidad'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Iniciar conversación</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/chat?user_id=${conversation.otherUser.id}${conversation.exchangeInfo ? `&exchange_id=${conversation.exchangeInfo.id}` : ''}`}
                className="block"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                        {conversation.otherUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mb-2">
                          @{conversation.otherUser.username}
                        </p>
                        
                        {/* Exchange Info */}
                        {conversation.exchangeInfo && (
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.exchangeInfo.status)}`}>
                              {getStatusText(conversation.exchangeInfo.status)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {conversation.exchangeInfo.itemName}
                            </span>
                          </div>
                        )}
                        
                        {/* Last Message */}
                        <p className="text-sm text-gray-700 truncate">
                          {conversation.lastMessage.senderId === currentUserId ? 'Tú: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo chat</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar usuario
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre de usuario o email..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Resultados de búsqueda */}
              <div className="max-h-64 overflow-y-auto">
                {searchingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Buscando usuarios...</p>
                  </div>
                ) : foundUsers.length > 0 ? (
                  <div className="space-y-2">
                    {foundUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => startNewChat(user.id)}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            @{user.username} • {user.email}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.isOnline ? 'En línea' : 'Desconectado'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchUsers.trim() ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No se encontraron usuarios
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Escribe para buscar usuarios
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewChatModal(false);
                    setSearchUsers('');
                    setFoundUsers([]);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={foundUsers.length === 0}
                  onClick={() => {
                    if (foundUsers.length === 1) {
                      startNewChat(foundUsers[0].id);
                    }
                  }}
                >
                  {foundUsers.length === 1 ? 'Iniciar chat' : 'Selecciona un usuario'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}