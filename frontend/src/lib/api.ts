import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { ApiResponse, PaginatedResponse, User, Category, Item } from '@/types';

// Tipos específicos para la API
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
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

// Auth response types
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  session: {
    id: string;
    user_id: string;
    created_at: string;
    expires_at: string;
  };
}

interface UserProfileData {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

interface UserSettings {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  privacy_level?: string;
}

interface ItemData {
  title: string;
  description: string;
  category_id: number;
  condition: string;
  estimated_value?: number;
  location?: string;
  images?: string[];
}

interface ItemSearchParams {
  q?: string;
  category_id?: number;
  condition?: string;
  location?: string;
  min_value?: number;
  max_value?: number;
  page?: number;
  limit?: number;
}

export interface ExchangeData {
  offered_item_id: number;
  requested_item_id: number;
  message?: string;
}

interface ExchangeUpdateData {
  status?: string;
  message?: string;
}

interface MessageData {
  content: string;
  message_type?: 'text' | 'image' | 'system' | 'exchange_proposal';
  receiver_id: string;
  exchange_id?: string;
  reply_to_id?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

interface NotificationSettings {
  email_enabled?: boolean;
  push_enabled?: boolean;
  exchange_updates?: boolean;
  new_messages?: boolean;
}

interface RatingData {
  exchange_id: number;
  rating: number;
  comment?: string;
}

interface RatingParams {
  user_id?: string;
  exchange_id?: number;
  page?: number;
  limit?: number;
}

interface RatingSettings {
  allow_public_ratings?: boolean;
  require_comments?: boolean;
}

// Configuración base para las peticiones
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Obtener token de autenticación
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  // Configurar headers con autenticación
  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Método genérico para hacer peticiones
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(includeAuth);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        // Manejar errores de validación de FastAPI (422)
        if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: { loc?: string[]; msg: string }) => {
            const field = err.loc ? err.loc.join('.') : 'campo';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(`Errores de validación: ${validationErrors}`);
        }
        
        throw new Error(errorData.detail || errorData.message || 'Error en la petición');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      },
      includeAuth
    );
  }

  async put<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // Método especial para subir archivos
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.detail || errorData.message || 'Error al subir archivo');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Funciones de utilidad para endpoints específicos
export const api = {
  // Autenticación
  auth: {
    login: (credentials: LoginCredentials) =>
      apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials, false),
    register: (userData: RegisterData) =>
      apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData, false),
    me: () => apiClient.get<User>(API_ENDPOINTS.AUTH.ME),
    logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  },

  // Usuarios
  users: {
    getProfile: () => apiClient.get<User>(API_ENDPOINTS.USERS.PROFILE),
    updateProfile: (data: UserProfileData) => apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE, data),
    getSettings: () => apiClient.get(API_ENDPOINTS.USERS.SETTINGS),
    updateSettings: (data: UserSettings) => apiClient.put(API_ENDPOINTS.USERS.SETTINGS, data),
    getMyItems: (params?: { status?: string; page?: number; page_size?: number }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return apiClient.get<PaginatedResponse<Item>>(`${API_ENDPOINTS.USERS.MY_ITEMS}${query}`);
    },
    getById: (id: string) => apiClient.get<User>(`/api/v1/users/${id}`),
  },

  // Items
  items: {
    list: (params?: ItemSearchParams) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return apiClient.get<PaginatedResponse<Item>>(`${API_ENDPOINTS.ITEMS.LIST}${query}`, false);
    },
    get: (id: string) => apiClient.get<Item>(`${API_ENDPOINTS.ITEMS.LIST}/${id}`),
    create: (data: ItemData | FormData) => apiClient.post<Item>(API_ENDPOINTS.ITEMS.CREATE, data),
    update: (id: string, data: Partial<ItemData> | FormData) => apiClient.put<Item>(`${API_ENDPOINTS.ITEMS.UPDATE}/${id}`, data),
    delete: (id: string) => apiClient.delete(`${API_ENDPOINTS.ITEMS.DELETE}/${id}`),
    search: (params: ItemSearchParams) => {
      const query = `?${new URLSearchParams(params as Record<string, string>).toString()}`;
      return apiClient.get(`${API_ENDPOINTS.ITEMS.SEARCH}${query}`);
    },
    getCategories: () => apiClient.get<Category[]>(API_ENDPOINTS.ITEMS.CATEGORIES, false),
    uploadImages: (itemId: string, formData: FormData) =>
      apiClient.uploadFile(`${API_ENDPOINTS.ITEMS.LIST}/${itemId}/images`, formData),
  },

  // Intercambios
  exchanges: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.EXCHANGES.LIST}${query}`);
    },
    get: (id: string) => apiClient.get(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}`),
    create: (data: ExchangeData) => apiClient.post(API_ENDPOINTS.EXCHANGES.CREATE, data),
    update: (id: string, data: ExchangeUpdateData) => apiClient.put(`${API_ENDPOINTS.EXCHANGES.UPDATE}/${id}`, data),
    accept: (id: string) => apiClient.post(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/accept`),
    reject: (id: string, data?: ExchangeUpdateData) => apiClient.post(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/reject`, data),
    cancel: (id: string, data?: ExchangeUpdateData) => apiClient.post(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/cancel`, data),
    complete: (id: string, data?: ExchangeUpdateData) => apiClient.post(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/complete`, data),
    getMessages: (id: string) => apiClient.get(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/messages`),
    sendMessage: (id: string, data: MessageData) => apiClient.post(`${API_ENDPOINTS.EXCHANGES.LIST}/${id}/messages`, data),
  },

  // Mensajes
  messages: {
    getConversations: (page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.MESSAGES.CONVERSATIONS}${query}`);
    },
    getConversation: (userId: string, page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.MESSAGES.CONVERSATION}/${userId}${query}`);
    },
    send: (data: MessageData) => apiClient.post(API_ENDPOINTS.MESSAGES.SEND, data),
    markAsRead: (data: { message_ids?: string[], conversation_with?: string }) => 
      apiClient.put(API_ENDPOINTS.MESSAGES.MARK_READ, data),
    search: (params: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.MESSAGES.SEARCH}${query}`);
    },
    getStats: () => apiClient.get(API_ENDPOINTS.MESSAGES.STATS),
  },

  // Notificaciones
  notifications: {
    list: (params?: NotificationParams) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.LIST}${query}`);
    },
    markAsRead: (id: string) => apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${id}/read`),
    markAllAsRead: () => apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/read-all`),
    getSettings: () => apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/settings`),
    updateSettings: (data: NotificationSettings) => apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/settings`, data),
  },

  // Calificaciones
  ratings: {
    list: (params?: RatingParams) => {
      const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return apiClient.get(`/api/v1/ratings${queryString}`);
    },
    create: (data: RatingData) => apiClient.post('/api/v1/ratings', data),
    update: (id: string, data: Partial<RatingData>) => apiClient.put(`/api/v1/ratings/${id}`, data),
    getStats: (userId?: string) => {
      const queryString = userId ? `?user_id=${userId}` : '';
      return apiClient.get(`/api/v1/ratings/stats${queryString}`);
    },
    getPending: () => apiClient.get('/api/v1/ratings/pending'),
    getSettings: () => apiClient.get('/api/v1/ratings/settings'),
    updateSettings: (data: RatingSettings) => apiClient.put('/api/v1/ratings/settings', data),
  },
};

export default api;