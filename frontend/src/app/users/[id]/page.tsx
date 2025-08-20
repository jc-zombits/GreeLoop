'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  MessageCircle, 
  MapPin, 
  Star, 
  Calendar, 
  Package, 
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  reputationScore: number;
  totalExchanges: number;
  successfulExchanges: number;
  successRate: number;
  memberSince: string;
  isOnline: boolean;
}

interface UserItem {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  status: string;
  estimatedValue?: number;
  images: string[];
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'reviews'>('items');
  const [currentUserId] = useState(1); // Simular usuario actual

  const userId = params.id as string;
  const isOwnProfile = currentUserId.toString() === userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Simular datos del usuario
        const mockUser: UserProfile = {
          id: parseInt(userId),
          username: `user_${userId}`,
          firstName: 'Ana',
          lastName: 'García',
          fullName: 'Ana García',
          bio: 'Apasionada por el intercambio sostenible y la economía circular. Me encanta dar nueva vida a objetos que ya no uso.',
          avatarUrl: undefined,
          city: 'Madrid',
          state: 'Madrid',
          country: 'España',
          reputationScore: 4.7,
          totalExchanges: 23,
          successfulExchanges: 21,
          successRate: 91.3,
          memberSince: 'Enero 2023',
          isOnline: Math.random() > 0.5
        };

        // Simular items del usuario
        const mockItems: UserItem[] = [
          {
            id: 1,
            name: 'Guitarra acústica Yamaha',
            description: 'Guitarra en excelente estado, incluye funda.',
            category: 'Música',
            condition: 'Muy bueno',
            status: 'Disponible',
            estimatedValue: 200,
            images: ['/api/placeholder/300/200'],
            createdAt: '2024-01-10'
          },
          {
            id: 2,
            name: 'Libros de programación',
            description: 'Colección de libros técnicos sobre desarrollo web.',
            category: 'Libros',
            condition: 'Bueno',
            status: 'Disponible',
            estimatedValue: 80,
            images: ['/api/placeholder/300/200'],
            createdAt: '2024-01-05'
          }
        ];

        setUser(mockUser);
        setUserItems(mockItems);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h1>
          <p className="text-gray-600 mb-6">El usuario que buscas no existe o no está disponible.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative mx-auto mb-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.fullName}</h1>
                  <p className="text-gray-600 mb-2">@{user.username}</p>
                  
                  {user.city && (
                    <div className="flex items-center justify-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{user.city}, {user.country}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-700 text-sm mb-6 text-left">{user.bio}</p>
                  )}

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="space-y-3">
                      <Link href={`/messages/chat?userId=${user.id}`} className="block">
                        <Button className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Enviar mensaje
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Reportar usuario
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{user.totalExchanges}</div>
                      <div className="text-sm text-gray-600">Intercambios</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900">{user.reputationScore}</span>
                      </div>
                      <div className="text-sm text-gray-600">Calificación</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="text-lg font-semibold text-gray-900">{user.successRate}%</div>
                    <div className="text-sm text-gray-600">Tasa de éxito</div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Miembro desde {user.memberSince}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'items'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Package className="h-4 w-4 mr-2 inline" />
                    Items ({userItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Star className="h-4 w-4 mr-2 inline" />
                    Reseñas ({user.totalExchanges})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'items' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={item.images[0]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-gray-600">{item.condition}</span>
                      </div>
                      {item.estimatedValue && (
                        <div className="mt-2 text-sm text-gray-600">
                          Valor estimado: €{item.estimatedValue}
                        </div>
                      )}
                      <div className="mt-3">
                        <Link href={`/items/${item.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Las reseñas estarán disponibles próximamente</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}