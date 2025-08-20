'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Search, Users, MessageCircle, Package, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  created_at: string;
  message_type: 'text' | 'exchange_proposal' | 'system';
}

interface ChatParticipant {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  is_online: boolean;
}

interface ItemInfo {
  id: number;
  name: string;
  owner: {
    id: number;
    name: string;
    username: string;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(null);
  const [otherUser, setOtherUser] = useState<ChatParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(1); // Simular usuario actual

  // Obtener parámetros de la URL
  const userId = searchParams.get('user_id');
  const exchangeId = searchParams.get('exchange_id');
  const itemId = searchParams.get('item_id');

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        if (!userId) return;
        
        // Obtener datos del otro usuario
        const userResponse = await fetch(`/api/v1/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('Error al obtener datos del usuario');
        }
        
        const userData = await userResponse.json();
        const apiOtherUser: ChatParticipant = {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar || '/api/placeholder/40/40',
          is_online: userData.is_online || false
        };
        setOtherUser(apiOtherUser);
        
        // Obtener información del item si hay exchangeId
        if (exchangeId) {
          const exchangeResponse = await fetch(`/api/v1/exchanges/${exchangeId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (exchangeResponse.ok) {
            const exchangeData = await exchangeResponse.json();
            const apiItemInfo: ItemInfo = {
              id: exchangeData.id,
              name: exchangeData.item_name || 'Item',
              owner: {
                id: exchangeData.owner_id,
                name: exchangeData.owner_name,
                username: exchangeData.owner_username
              }
            };
            setItemInfo(apiItemInfo);
          }
        }

        // Obtener mensajes de la conversación
        const messagesResponse = await fetch(`/api/v1/messages/conversation/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!messagesResponse.ok) {
          throw new Error('Error al obtener mensajes');
        }
        
        const messagesData = await messagesResponse.json();
        const apiMessages: Message[] = messagesData.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            username: msg.sender.username,
            avatar: msg.sender.avatar || '/api/placeholder/40/40'
          },
          created_at: msg.created_at,
          message_type: msg.message_type
        }));
        setMessages(apiMessages);
        
        // Marcar mensajes como leídos
        await fetch('/api/v1/messages/mark-read', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ conversation_with: userId })
        });
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChatData();
    }
  }, [userId, exchangeId, currentUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Enviar mensaje a la API
      const response = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          receiver_id: userId,
          message_type: 'text',
          exchange_id: exchangeId || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const sentMessage = await response.json();
      
      // Agregar el mensaje enviado a la lista local
      const newMessageObj: Message = {
        id: sentMessage.id,
        content: sentMessage.content,
        sender: {
          id: sentMessage.sender.id,
          name: sentMessage.sender.name,
          username: sentMessage.sender.username,
          avatar: sentMessage.sender.avatar || '/api/placeholder/40/40'
        },
        created_at: sentMessage.created_at,
        message_type: sentMessage.message_type
      };

      setMessages(prev => [...prev, newMessageObj]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restaurar el mensaje en caso de error
      setNewMessage(messageContent);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
               <Link href="/messages/conversations" className="text-green-600 hover:text-green-700">
                 <ArrowLeft className="h-6 w-6" />
               </Link>
               <div className="flex items-center space-x-3">
                 <div className="relative">
                   <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                     <User className="h-6 w-6 text-gray-400" />
                   </div>
                   {otherUser?.is_online && (
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                   )}
                 </div>
                 <div>
                   <h1 className="text-xl font-semibold text-gray-900">
                     {otherUser?.name || 'Usuario'}
                   </h1>
                   <p className="text-sm text-gray-600">
                     @{otherUser?.username} • {otherUser?.is_online ? 'En línea' : 'Desconectado'}
                   </p>
                 </div>
               </div>
             </div>
             {itemInfo && (
               <div className="flex items-center space-x-2 text-sm text-gray-600">
                 <Package className="h-4 w-4" />
                 <span>Sobre: {itemInfo.name}</span>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Item Info Banner */}
      {itemInfo && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Package className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <span className="font-medium text-blue-900">Item:</span>
                  <span className="text-blue-800 ml-2">{itemInfo.name}</span>
                  <span className="text-blue-700 ml-2">por {itemInfo.owner.name}</span>
                </div>
              </div>
              <Link href={`/exchanges/new?item_id=${itemInfo.id}&owner_id=${itemInfo.owner.id}`}>
                <Button size="sm" variant="outline">
                  Proponer intercambio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}



      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId;
            
            return (
              <div key={message.id} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      @{message.sender.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className={`inline-block max-w-full px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu mensaje..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}