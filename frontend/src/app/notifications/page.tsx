'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Bell, MessageSquare, Package, CheckCircle, XCircle, Info, Calendar, ArrowRight, Trash2, ChevronDown, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Notification } from '@/types';

export default function NotificationsPage() {
    const router = useRouter();
    const { 
        notifications, 
        loading, 
        markAsRead, 
        markAllAsRead, 
        unreadCount 
    } = useNotifications();
    
    // State for filtering
    const [filterType, setFilterType] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filterOptions = [
        { value: 'all', label: 'Todas' },
        { value: 'messages', label: 'Mensajes' },
        { value: 'exchanges', label: 'Intercambios' },
        { value: 'events', label: 'Eventos' },
    ];

    // Filtered notifications
    const displayNotifications = notifications.filter((notification: Notification) => {
        if (filterType === 'all') return true;
        
        switch (filterType) {
            case 'messages':
                return notification.type === 'new_message';
            case 'exchanges':
                return [
                    'exchange_proposal', 
                    'exchange_accepted', 
                    'exchange_rejected', 
                    'exchange_completed'
                ].includes(notification.type);
            case 'events':
                return notification.type === 'system';
            default:
                return true;
        }
    });

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }

        // Redirect logic
        const actionUrl = notification.data?.['actionUrl'] as string | undefined;
        if (actionUrl) {
            router.push(actionUrl);
        } else {
            // Fallback redirection based on type
            switch (notification.type) {
                case 'new_message':
                    router.push('/messages');
                    break;
                case 'exchange_proposal':
                case 'exchange_accepted':
                case 'exchange_rejected':
                case 'exchange_completed':
                    router.push('/exchanges');
                    break;
                case 'item_liked':
                    router.push('/items'); // Ideally to specific item if ID was known
                    break;
                default:
                    // Stay on page or go to dashboard
                    break;
            }
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_message':
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'exchange_proposal':
            case 'exchange_accepted':
            case 'exchange_rejected':
            case 'exchange_completed':
                return <Package className="h-5 w-5 text-green-500" />;
            case 'system':
                return <Info className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getBgColor = (read: boolean) => {
        return read ? 'bg-white' : 'bg-green-50';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
                        <p className="text-gray-600 mt-1">
                            Mantente al día con tu actividad en GreenLoop
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white pl-4 pr-10 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                            >
                                <Filter className="h-4 w-4 text-gray-500" />
                                <span>{filterOptions.find(o => o.value === filterType)?.label}</span>
                                <ChevronDown className={`absolute right-3 h-4 w-4 text-gray-500 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Backdrop for click outside */}
                            {isFilterOpen && (
                                <div 
                                    className="fixed inset-0 z-10 cursor-default" 
                                    onClick={() => setIsFilterOpen(false)}
                                ></div>
                            )}

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setFilterType(option.value);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`${
                                                filterType === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                            } group flex w-full items-center px-4 py-2 text-sm hover:bg-green-50 hover:text-green-700 transition-colors text-left`}
                                        >
                                            {option.label}
                                            {filterType === option.value && (
                                                <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => markAllAsRead()}
                                className="text-green-600 border-green-600 hover:bg-green-50 whitespace-nowrap rounded-full"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar leídas
                            </Button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayNotifications.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No tienes notificaciones</h3>
                                <p className="text-gray-500 mt-2">
                                    Te avisaremos cuando haya actividad importante.
                                </p>
                            </div>
                        ) : (
                            displayNotifications.map((notification) => (
                                <Card 
                                    key={notification.id} 
                                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${getBgColor(notification.read)} border-l-4 ${notification.read ? 'border-l-transparent' : 'border-l-green-500'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {typeof notification.data?.['actionText'] === 'string' && (
                                                <div className="mt-2">
                                                    <span className="text-xs font-medium text-green-600 flex items-center">
                                                        {notification.data['actionText']}
                                                        <ArrowRight className="h-3 w-3 ml-1" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {!notification.read && (
                                            <div className="flex-shrink-0 self-center">
                                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
