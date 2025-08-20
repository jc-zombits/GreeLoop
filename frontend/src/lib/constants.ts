// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    REFRESH: '/api/v1/auth/refresh'
  },
  USERS: {
    PROFILE: '/api/v1/users/profile',
    UPDATE: '/api/v1/users/update',
    SETTINGS: '/api/v1/users/settings',
    MY_ITEMS: '/api/v1/users/me/items'
  },
  ITEMS: {
    LIST: '/api/v1/items',
    CREATE: '/api/v1/items',
    UPDATE: '/api/v1/items',
    DELETE: '/api/v1/items',
    SEARCH: '/api/v1/items/search',
    CATEGORIES: '/api/v1/items/categories'
  },
  EXCHANGES: {
    LIST: '/api/v1/exchanges',
    CREATE: '/api/v1/exchanges',
    UPDATE: '/api/v1/exchanges',
    MESSAGES: '/api/v1/exchanges/messages'
  },
  MESSAGES: {
    CONVERSATIONS: '/api/v1/messages/conversations',
    CONVERSATION: '/api/v1/messages/conversation',
    SEND: '/api/v1/messages/send',
    MARK_READ: '/api/v1/messages/mark-read',
    SEARCH: '/api/v1/messages/search',
    STATS: '/api/v1/messages/stats'
  },
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: '/api/v1/notifications/read'
  }
};

// Application Constants
export const APP_NAME = 'GreenLoop';
export const APP_DESCRIPTION = 'Plataforma de intercambio de objetos para promover la economía circular y sostenibilidad';
export const APP_VERSION = '1.0.0';

// Item Categories
export const ITEM_CATEGORIES = [
  {
    id: 'electronics',
    name: 'Electrónicos',
    icon: '📱',
    description: 'Dispositivos electrónicos, gadgets y accesorios'
  },
  {
    id: 'home-garden',
    name: 'Hogar y Jardín',
    icon: '🏠',
    description: 'Artículos para el hogar, decoración y jardinería'
  },
  {
    id: 'books-education',
    name: 'Libros y Educación',
    icon: '📚',
    description: 'Libros, material educativo y recursos de aprendizaje'
  },
  {
    id: 'sports-leisure',
    name: 'Deportes y Ocio',
    icon: '⚽',
    description: 'Equipamiento deportivo y artículos de entretenimiento'
  },
  {
    id: 'clothing-accessories',
    name: 'Ropa y Accesorios',
    icon: '👕',
    description: 'Ropa, calzado y accesorios de moda'
  },
  {
    id: 'vehicles',
    name: 'Vehículos',
    icon: '🚗',
    description: 'Vehículos, bicicletas y accesorios de transporte'
  },
  {
    id: 'health-beauty',
    name: 'Salud y Belleza',
    icon: '💄',
    description: 'Productos de cuidado personal y belleza'
  },
  {
    id: 'tools',
    name: 'Herramientas',
    icon: '🔧',
    description: 'Herramientas de trabajo y bricolaje'
  },
  {
    id: 'music-instruments',
    name: 'Música e Instrumentos',
    icon: '🎸',
    description: 'Instrumentos musicales y equipos de audio'
  }
];

// Item Conditions
export const ITEM_CONDITIONS = [
  { value: 'Nuevo', label: 'Nuevo', description: 'Sin usar, en su empaque original' },
  { value: 'Como nuevo', label: 'Como nuevo', description: 'Usado muy poco, excelente estado' },
  { value: 'Muy bueno', label: 'Muy bueno', description: 'Usado con cuidado, muy buen estado' },
  { value: 'Bueno', label: 'Bueno', description: 'Usado regularmente, buen estado general' },
  { value: 'Aceptable', label: 'Aceptable', description: 'Usado con signos de desgaste, funcional' }
];

// Exchange Status
export const EXCHANGE_STATUS = {
  PROPOSAL_SENT: 'Propuesta enviada',
  PROPOSAL_RECEIVED: 'Propuesta recibida',
  IN_NEGOTIATION: 'En negociación',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado'
};

// Item Status
export const ITEM_STATUS = {
  AVAILABLE: 'Disponible',
  IN_EXCHANGE: 'En intercambio',
  EXCHANGED: 'Intercambiado',
  INACTIVE: 'Inactivo'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [6, 12, 24, 48]
};

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 1000,
  ITEM_NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_ITEMS: 'draft_items'
};

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#059669', // green-600
    SECONDARY: '#0891b2', // cyan-600
    SUCCESS: '#10b981', // emerald-500
    WARNING: '#f59e0b', // amber-500
    ERROR: '#ef4444', // red-500
    INFO: '#3b82f6' // blue-500
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  }
};

// Social Media Links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/greenloop',
  TWITTER: 'https://twitter.com/greenloop',
  INSTAGRAM: 'https://instagram.com/greenloop',
  LINKEDIN: 'https://linkedin.com/company/greenloop'
};

// Contact Information
export const CONTACT = {
  EMAIL: 'contacto@greenloop.com',
  PHONE: '+34 900 123 456',
  ADDRESS: 'Calle Sostenible 123, 28001 Madrid, España'
};

// Feature Flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_CHAT: true,
  ENABLE_RATINGS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_DARK_MODE: false // Coming soon
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Por favor, inténtalo más tarde.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Tamaño máximo: 10MB.',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten imágenes.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ITEM_CREATED: 'Item creado exitosamente',
  ITEM_UPDATED: 'Item actualizado exitosamente',
  ITEM_DELETED: 'Item eliminado exitosamente',
  EXCHANGE_CREATED: 'Propuesta de intercambio enviada',
  EXCHANGE_ACCEPTED: 'Intercambio aceptado',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  SETTINGS_SAVED: 'Configuración guardada exitosamente'
};