// User types
export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  reputation_score: number;
  total_exchanges: number;
  successful_exchanges: number;
  success_rate: number;
  // Legacy fields for compatibility
  name?: string;
  location?: string;
  avatar?: string;
  joinDate?: string;
  rating?: number;
  totalExchanges?: number;
  isVerified?: boolean;
}

// Item types
export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: ItemCondition;
  estimatedValue?: number;
  location: string;
  tags: string[];
  images: string[];
  ownerId: string;
  owner: User;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
}

export type ItemCondition = 'Nuevo' | 'Como nuevo' | 'Muy bueno' | 'Bueno' | 'Aceptable';
export type ItemStatus = 'Disponible' | 'En intercambio' | 'Intercambiado' | 'Inactivo';

// Exchange types
export interface Exchange {
  id: string;
  initiatorId: string;
  initiator: User;
  receiverId: string;
  receiver: User;
  initiatorItems: Item[];
  receiverItems: Item[];
  status: ExchangeStatus;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  rating?: ExchangeRating;
}

export type ExchangeStatus = 
  | 'Propuesta enviada'
  | 'Propuesta recibida'
  | 'En negociación'
  | 'Aceptado'
  | 'Rechazado'
  | 'Completado'
  | 'Cancelado';

export interface ExchangeRating {
  initiatorRating?: number;
  receiverRating?: number;
  initiatorComment?: string;
  receiverComment?: string;
}

// Message types
export interface Message {
  id: string;
  exchangeId: string;
  senderId: string;
  sender: User;
  content: string;
  type: MessageType;
  createdAt: string;
  readAt?: string;
}

export type MessageType = 'text' | 'image' | 'system';

// Category types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  subcategories?: Category[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'exchange_proposal'
  | 'exchange_accepted'
  | 'exchange_rejected'
  | 'exchange_completed'
  | 'new_message'
  | 'item_liked'
  | 'system';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
  accept_privacy: boolean;
}

export interface ItemForm {
  name: string;
  description: string;
  category: string;
  condition: ItemCondition;
  estimatedValue?: number;
  location: string;
  tags: string;
}

// Filter types
export interface ItemFilters {
  category?: string;
  condition?: ItemCondition;
  location?: string;
  minValue?: number;
  maxValue?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'value_asc' | 'value_desc' | 'name';
}

export interface ExchangeFilters {
  status?: ExchangeStatus;
  search?: string;
  sortBy?: 'newest' | 'oldest';
}

// Settings types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newsletter: boolean;
    exchanges: boolean;
    messages: boolean;
    marketing: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showStats: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    dataSharing: boolean;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    currency: string;
    distance: 'km' | 'mi';
    autoSave: boolean;
  };
}

// Statistics types
export interface UserStats {
  totalItems: number;
  activeItems: number;
  totalExchanges: number;
  completedExchanges: number;
  averageRating: number;
  totalViews: number;
  totalLikes: number;
  joinDate: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  totalExchanges: number;
  activeExchanges: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'item_created' | 'exchange_proposed' | 'exchange_completed' | 'user_joined';
  description: string;
  userId: string;
  user: User;
  createdAt: string;
  data?: Record<string, unknown>;
}