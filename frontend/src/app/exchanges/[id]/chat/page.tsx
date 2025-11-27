'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Paperclip, MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  message_type: 'text' | 'exchange_request' | 'system';
  is_read: boolean;
}

interface ChatUser {
  id: number;
  username: string;
  full_name: string;
  avatar?: string;
  is_online: boolean;
}

interface ExchangeInfo {
  id: number;
  status: string;
  requester_item: string;
  requested_item: string;
}

export default function ExchangeChatPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [exchangeInfo, setExchangeInfo] = useState<ExchangeInfo | null>(null);
  const [currentUserId] = useState(1); // Simular usuario actual
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        // Datos de demostración - en el futuro será una llamada real a la API
        const mockChatUser: ChatUser = {
          id: 2,
          username: 'music_lover',
          full_name: 'Ana García',
          avatar: '/api/placeholder/40/40',
          is_online: true
        };

        const mockExchangeInfo: ExchangeInfo = {
          id: parseInt(params.id as string),
          status: 'pending',
          requester_item: 'Bicicleta de montaña Trek',
          requested_item: 'Guitarra acústica Yamaha'
        };

        const mockMessages: Message[] = [
          {
            id: 1,
            content: 'Hola! Me interesa mucho tu guitarra. Mi bicicleta está en excelente estado y creo que sería un intercambio justo.',
            sender_id: 1,
            receiver_id: 2,
            created_at: '2024-01-15T10:30:00Z',
            message_type: 'exchange_request',
            is_read: true
          },
          {
            id: 2,
            content: '¡Hola! Tu bicicleta se ve increíble. ¿Podrías contarme más sobre su estado y cuánto tiempo la has tenido?',
            sender_id: 2,
            receiver_id: 1,
            created_at: '2024-01-15T11:15:00Z',
            message_type: 'text',
            is_read: true
          },
          {
            id: 3,
            content: 'Claro! La compré hace 2 años pero la he usado muy poco, tal vez unas 10 veces. Está prácticamente nueva. ¿Tu guitarra incluye algún accesorio?',
            sender_id: 1,
            receiver_id: 2,
            created_at: '2024-01-15T11:45:00Z',
            message_type: 'text',
            is_read: true
          },
          {
            id: 4,
            content: 'Sí, incluye la funda original, un set de cuerdas nuevas y algunas púas. ¿Podríamos quedar para ver ambos objetos en persona?',
            sender_id: 2,
            receiver_id: 1,
            created_at: '2024-01-15T12:20:00Z',
            message_type: 'text',
            is_read: false
          }
        ];

        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setChatUser(mockChatUser);
        setExchangeInfo(mockExchangeInfo);
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchChatData();
    }
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      content: newMessage,
      sender_id: currentUserId,
      receiver_id: chatUser?.id || 2,
      created_at: new Date().toISOString(),
      message_type: 'text',
      is_read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Aquí iría la llamada real a la API para enviar el mensaje
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src={chatUser?.avatar || '/api/placeholder/40/40'}
                  alt={chatUser?.full_name || 'Usuario'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                {chatUser?.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {chatUser?.full_name}
                </h1>
                <p className="text-sm text-gray-500">
                  @{chatUser?.username} • {chatUser?.is_online ? 'En línea' : 'Desconectado'}
                </p>
              </div>
            </div>
          </div>

          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Exchange Info Banner */}
      {exchangeInfo && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium text-blue-900">Intercambio #{exchangeInfo.id}:</span>
                  <span className="text-blue-800 ml-2">
                    {exchangeInfo.requester_item} ↔ {exchangeInfo.requested_item}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exchangeInfo.status)}`}>
                {getStatusText(exchangeInfo.status)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            const isExchangeRequest = message.message_type === 'exchange_request';
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isExchangeRequest
                    ? 'bg-green-100 border border-green-200'
                    : isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  {isExchangeRequest && (
                    <div className="text-xs font-medium text-green-800 mb-1">
                      Solicitud de intercambio
                    </div>
                  )}
                  <p className={`text-sm ${
                    isExchangeRequest
                      ? 'text-green-800'
                      : isOwnMessage
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    {message.content}
                  </p>
                  <div className={`text-xs mt-1 ${
                    isExchangeRequest
                      ? 'text-green-600'
                      : isOwnMessage
                      ? 'text-blue-200'
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.created_at)}
                    {isOwnMessage && (
                      <span className="ml-1">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <button className="text-gray-500 hover:text-gray-700 p-2">
              <Paperclip className="h-5 w-5" />
            </button>
            
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}