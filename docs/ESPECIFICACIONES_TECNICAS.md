# Especificaciones Técnicas - Trueque Verde 2.0

## Configuración del Proyecto

### Estructura de Directorios

```
greenloop/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── item.py
│   │   │   ├── exchange.py
│   │   │   └── base.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── item.py
│   │   │   └── exchange.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── items.py
│   │   │       └── exchanges.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── item_service.py
│   │   │   └── exchange_service.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── email.py
│   │   │   ├── image.py
│   │   │   └── location.py
│   │   └── tests/
│   ├── alembic/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── types/
│   │       ├── auth.ts
│   │       ├── item.ts
│   │       └── event.ts ✅ **IMPLEMENTADO**
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
├── docs/
├── docker-compose.yml
└── README.md
```

## Backend - FastAPI

### Configuración Principal

#### requirements.txt
```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
asyncpg==0.29.0
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
aiofiles==23.2.1
celery==5.3.4
redis==5.0.1
pillow==10.2.0
pydantic[email]==2.6.0
pydantic-settings==2.2.0
pytest==8.0.0
pytest-asyncio==0.23.5
httpx==0.27.0
faker==24.0.0
```

#### app/core/config.py
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    
    # External APIs
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Modelos de Base de Datos

#### app/models/base.py
```python
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### app/models/user.py
```python
from sqlalchemy import Column, String, Boolean, Float, DateTime, Text
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    bio = Column(Text)
    profile_image_url = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    city = Column(String(100))
    country = Column(String(100))
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    items = relationship("Item", back_populates="owner")
    sent_exchanges = relationship("Exchange", foreign_keys="Exchange.requester_id")
    received_exchanges = relationship("Exchange", foreign_keys="Exchange.owner_id")
```

### Esquemas Pydantic

#### app/schemas/user.py
```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserResponse(UserBase):
    id: UUID
    profile_image_url: Optional[str] = None
    is_active: bool
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProfile(UserResponse):
    total_items: int = 0
    completed_exchanges: int = 0
    average_rating: float = 0.0
    total_ratings: int = 0
```

### APIs REST

#### app/api/v1/auth.py
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Registrar nuevo usuario"""
    auth_service = AuthService(db)
    return await auth_service.register_user(user_data)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Autenticar usuario y devolver tokens"""
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(form_data.username, form_data.password)

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Renovar access token usando refresh token"""
    auth_service = AuthService(db)
    return await auth_service.refresh_access_token(refresh_token)
```

#### app/api/v1/items.py
```python
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.item_service import ItemService
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemSearch
from app.models.user import User

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/", response_model=List[ItemResponse])
async def get_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtener lista de objetos con filtros"""
    item_service = ItemService(db)
    search_params = ItemSearch(
        category_id=category_id,
        search=search,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km
    )
    return await item_service.get_items(search_params, skip, limit)

@router.post("/", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo objeto"""
    item_service = ItemService(db)
    return await item_service.create_item(item_data, current_user.id)

@router.post("/{item_id}/images")
async def upload_item_images(
    item_id: UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subir imágenes para un objeto"""
    item_service = ItemService(db)
    return await item_service.upload_images(item_id, files, current_user.id)
```

### Servicios de Negocio

#### app/services/auth_service.py
```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import Token

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    async def register_user(self, user_data: UserCreate) -> User:
        # Verificar si el email ya existe
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Crear nuevo usuario
        hashed_password = self.get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            bio=user_data.bio,
            latitude=user_data.latitude,
            longitude=user_data.longitude,
            city=user_data.city,
            country=user_data.country
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    async def authenticate_user(self, email: str, password: str) -> Token:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not self.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = self.create_access_token(
            data={"sub": str(user.id), "type": "refresh"}, 
            expires_delta=refresh_token_expires
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
```

## Frontend - Next.js + React

### Configuración Principal

#### package.json
```json
{
  "name": "greenloop-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.1.0",
    "axios": "^1.6.7",
    "antd": "^5.14.1",
    "tailwindcss": "^3.4.1",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@types/leaflet": "^1.9.8",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "js-cookie": "^3.0.5",
    "@types/js-cookie": "^3.0.6",
    "react-query": "^3.39.3",
    "socket.io-client": "^4.7.4"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "autoprefixer": "^10.0.1",
    "postcss": "^8"
  }
}
```

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### Store Redux

#### src/store/index.ts
```typescript
import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import itemsSlice from './slices/itemsSlice'
import exchangesSlice from './slices/exchangesSlice'
import notificationsSlice from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    items: itemsSlice,
    exchanges: exchangesSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

#### src/store/slices/authSlice.ts
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authAPI } from '@/services/api'
import { User, LoginCredentials, RegisterData } from '@/types/auth'
import Cookies from 'js-cookie'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('access_token') || null,
  isAuthenticated: !!Cookies.get('access_token'),
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      Cookies.set('access_token', response.access_token, { expires: 1 })
      Cookies.set('refresh_token', response.refresh_token, { expires: 7 })
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Registration failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.access_token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
```

### Servicios API

#### src/services/api.ts
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth'
import { Item, ItemCreate, ItemUpdate } from '@/types/item'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor para agregar token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, intentar refresh
          const refreshToken = Cookies.get('refresh_token')
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken)
              Cookies.set('access_token', response.access_token, { expires: 1 })
              // Reintentar request original
              return this.client.request(error.config)
            } catch (refreshError) {
              // Refresh falló, redirigir a login
              Cookies.remove('access_token')
              Cookies.remove('refresh_token')
              window.location.href = '/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)
    
    const response = await this.client.post('/auth/login', formData)
    return response.data
  }

  async register(userData: RegisterData): Promise<any> {
    const response = await this.client.post('/auth/register', userData)
    return response.data
  }

  // Items endpoints
  async getItems(params?: any): Promise<Item[]> {
    const response = await this.client.get('/items', { params })
    return response.data
  }

  async createItem(itemData: ItemCreate): Promise<Item> {
    const response = await this.client.post('/items', itemData)
    return response.data
  }

  async uploadItemImages(itemId: string, files: File[]): Promise<any> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    const response = await this.client.post(`/items/${itemId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

export const apiClient = new APIClient()
export const authAPI = apiClient
export const itemsAPI = apiClient
```

### Componentes React

#### src/components/ItemCard.tsx
```typescript
import React from 'react'
import { Card, Tag, Avatar, Rate } from 'antd'
import { HeartOutlined, EnvironmentOutlined } from '@ant-design/icons'
import Image from 'next/image'
import Link from 'next/link'
import { Item } from '@/types/item'

interface ItemCardProps {
  item: Item
  onFavorite?: (itemId: string) => void
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onFavorite }) => {
  const { Meta } = Card

  const getConditionColor = (condition: string) => {
    const colors = {
      new: 'green',
      like_new: 'blue',
      good: 'orange',
      fair: 'yellow',
      needs_repair: 'red'
    }
    return colors[condition as keyof typeof colors] || 'default'
  }

  const getConditionText = (condition: string) => {
    const texts = {
      new: 'Nuevo',
      like_new: 'Como nuevo',
      good: 'Buen estado',
      fair: 'Estado regular',
      needs_repair: 'Necesita reparación'
    }
    return texts[condition as keyof typeof texts] || condition
  }

  return (
    <Card
      hoverable
      className="w-full max-w-sm mx-auto shadow-md hover:shadow-lg transition-shadow"
      cover={
        <div className="relative h-48 overflow-hidden">
          <Image
            src={item.images?.[0]?.url || '/placeholder-image.jpg'}
            alt={item.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Tag color={getConditionColor(item.condition)}>
              {getConditionText(item.condition)}
            </Tag>
          </div>
        </div>
      }
      actions={[
        <HeartOutlined 
          key="favorite" 
          onClick={() => onFavorite?.(item.id)}
          className="text-gray-500 hover:text-red-500"
        />,
        <Link href={`/items/${item.id}`} key="view">
          <span className="text-blue-500 hover:text-blue-700">Ver detalles</span>
        </Link>
      ]}
    >
      <Meta
        avatar={
          <Avatar 
            src={item.owner.profile_image_url} 
            alt={`${item.owner.first_name} ${item.owner.last_name}`}
          />
        }
        title={
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-800 truncate">
              {item.title}
            </span>
          </div>
        }
        description={
          <div className="space-y-2">
            <p className="text-gray-600 text-sm line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-xs">
                <EnvironmentOutlined className="mr-1" />
                <span>{item.city}</span>
              </div>
              <div className="flex items-center">
                <Rate 
                  disabled 
                  defaultValue={item.owner.average_rating} 
                  size="small" 
                  className="text-xs"
                />
                <span className="ml-1 text-xs text-gray-500">
                  ({item.owner.total_ratings})
                </span>
              </div>
            </div>
          </div>
        }
      />
    </Card>
  )
}

export default ItemCard
```

#### src/components/EventCard.tsx ✅ **IMPLEMENTADO**
```typescript
import React from 'react'
import { Card, Tag, Badge } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { Event } from '@/types/event'

interface EventCardProps {
  event: Event
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { Meta } = Card

  const getCategoryColor = (category: string) => {
    const colors = {
      'Intercambio de Objetos': 'blue',
      'Taller de Reparación': 'green',
      'Mercado Verde': 'orange',
      'Educación Ambiental': 'purple',
      'Limpieza Comunitaria': 'cyan',
      'Otro': 'default'
    }
    return colors[category as keyof typeof colors] || 'default'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM format
  }

  return (
    <Card
      hoverable
      className="w-full max-w-sm mx-auto shadow-md hover:shadow-lg transition-shadow"
      cover={
        <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <div className="text-white text-center">
            <CalendarOutlined className="text-4xl mb-2" />
            <div className="text-lg font-semibold">{formatDate(event.date)}</div>
            <div className="text-sm">{formatTime(event.time)}</div>
          </div>
          <div className="absolute top-2 right-2">
            <Tag color={getCategoryColor(event.category)}>
              {event.category}
            </Tag>
          </div>
          {event.eventType === 'paid' && (
            <div className="absolute top-2 left-2">
              <Badge count={<DollarOutlined />} style={{ backgroundColor: '#52c41a' }} />
            </div>
          )}
        </div>
      }
    >
      <Meta
        title={
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-800 truncate">
              {event.title}
            </span>
          </div>
        }
        description={
          <div className="space-y-2">
            <p className="text-gray-600 text-sm line-clamp-2">
              {event.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <EnvironmentOutlined className="mr-1" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <UserOutlined className="mr-1" />
                <span>{event.capacity} personas</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Tag color={event.eventType === 'free' ? 'green' : 'blue'}>
                {event.eventType === 'free' ? 'Gratuito' : 'De pago'}
              </Tag>
              <Link href={`/events/${event.id}`}>
                <span className="text-blue-500 hover:text-blue-700 text-sm">Ver detalles</span>
              </Link>
            </div>
          </div>
        }
      />
    </Card>
  )
}

export default EventCard
```

#### src/components/EventForm.tsx ✅ **IMPLEMENTADO**
```typescript
import React from 'react'
import { Form, Input, Select, DatePicker, TimePicker, InputNumber, Radio, Button, Card } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, DollarOutlined, FileTextOutlined, TagOutlined } from '@ant-design/icons'
import { EventFormData } from '@/types/event'

const { TextArea } = Input
const { Option } = Select

interface EventFormProps {
  onSubmit: (data: EventFormData) => void
  loading?: boolean
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, loading = false }) => {
  const [form] = Form.useForm()

  const categories = [
    'Intercambio de Objetos',
    'Taller de Reparación',
    'Mercado Verde',
    'Educación Ambiental',
    'Limpieza Comunitaria',
    'Otro'
  ]

  const handleSubmit = (values: any) => {
    const formData: EventFormData = {
      title: values.title,
      description: values.description,
      date: values.date.format('YYYY-MM-DD'),
      time: values.time.format('HH:mm'),
      location: values.location,
      category: values.category,
      capacity: values.capacity,
      eventType: values.eventType
    }
    onSubmit(formData)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card title="Crear Nuevo Evento" className="shadow-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          {/* Información Básica */}
          <Card type="inner" title={<><FileTextOutlined className="mr-2" />Información Básica</>}>
            <Form.Item
              name="title"
              label="Título del Evento"
              rules={[{ required: true, message: 'Por favor ingresa el título del evento' }]}
            >
              <Input placeholder="Ej: Intercambio de libros en el parque" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Descripción"
              rules={[{ required: true, message: 'Por favor ingresa una descripción' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe tu evento, qué actividades se realizarán, qué pueden traer los participantes, etc."
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Categoría"
              rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}
            >
              <Select placeholder="Selecciona la categoría del evento">
                {categories.map(category => (
                  <Option key={category} value={category}>
                    <TagOutlined className="mr-2" />
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {/* Fecha y Hora */}
          <Card type="inner" title={<><CalendarOutlined className="mr-2" />Fecha y Hora</>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="date"
                label="Fecha"
                rules={[{ required: true, message: 'Por favor selecciona la fecha' }]}
              >
                <DatePicker 
                  className="w-full"
                  placeholder="Selecciona la fecha"
                  format="DD/MM/YYYY"
                />
              </Form.Item>

              <Form.Item
                name="time"
                label="Hora"
                rules={[{ required: true, message: 'Por favor selecciona la hora' }]}
              >
                <TimePicker 
                  className="w-full"
                  placeholder="Selecciona la hora"
                  format="HH:mm"
                />
              </Form.Item>
            </div>
          </Card>

          {/* Ubicación */}
          <Card type="inner" title={<><EnvironmentOutlined className="mr-2" />Ubicación</>}>
            <Form.Item
              name="location"
              label="Dirección o lugar del evento"
              rules={[{ required: true, message: 'Por favor ingresa la ubicación' }]}
            >
              <Input placeholder="Ej: Parque Central, Calle 123, Ciudad" />
            </Form.Item>
          </Card>

          {/* Capacidad y Precio */}
          <Card type="inner" title={<><UserOutlined className="mr-2" />Capacidad y Precio</>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="capacity"
                label="Capacidad Máxima"
                rules={[{ required: true, message: 'Por favor ingresa la capacidad máxima' }]}
              >
                <InputNumber 
                  className="w-full"
                  min={1}
                  max={1000}
                  placeholder="Número de participantes"
                />
              </Form.Item>

              <Form.Item
                name="eventType"
                label="Tipo de Evento"
                rules={[{ required: true, message: 'Por favor selecciona el tipo de evento' }]}
              >
                <Radio.Group className="w-full">
                  <Radio.Button value="free" className="w-1/2 text-center">
                    <span className="text-green-600">Gratuito</span>
                    <div className="text-xs text-gray-500">Sin costo para los participantes</div>
                  </Radio.Button>
                  <Radio.Button value="paid" className="w-1/2 text-center">
                    <DollarOutlined className="text-blue-600" />
                    <span className="text-blue-600 ml-1">De pago</span>
                    <div className="text-xs text-gray-500">Requiere pago para participar</div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>
          </Card>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              className="w-full bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
            >
              Crear Evento
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default EventForm
```

### Tipos TypeScript

#### src/types/event.ts ✅ **IMPLEMENTADO**
```typescript
export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  capacity: number
  eventType: 'free' | 'paid'
  createdAt: string
  updatedAt: string
}

export interface EventFormData {
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  capacity: number | string
  eventType: 'free' | 'paid'
}

export interface EventFilters {
  category?: string
  eventType?: 'free' | 'paid'
  search?: string
}
```

### Páginas Implementadas

#### src/app/events/page.tsx ✅ **IMPLEMENTADO**
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Input, Select, Card, Row, Col, Empty, Spin } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import { Event, EventFilters } from '@/types/event'

const { Option } = Select

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [filters, setFilters] = useState<EventFilters>({})
  const [loading, setLoading] = useState(true)

  const categories = [
    'Intercambio de Objetos',
    'Taller de Reparación',
    'Mercado Verde',
    'Educación Ambiental',
    'Limpieza Comunitaria',
    'Otro'
  ]

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [events, filters])

  const loadEvents = () => {
    try {
      const savedEvents = localStorage.getItem('events')
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        setEvents(parsedEvents)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...events]

    if (filters.category) {
      filtered = filtered.filter(event => event.category === filters.category)
    }

    if (filters.eventType) {
      filtered = filtered.filter(event => event.eventType === filters.eventType)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower)
      )
    }

    setFilteredEvents(filtered)
  }

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Eventos Comunitarios</h1>
          <p className="text-gray-600">Descubre y participa en eventos de intercambio y sostenibilidad</p>
        </div>
        <Link href="/events/create">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
            <PlusOutlined />
            Crear Evento
          </button>
        </Link>
      </div>

      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar eventos..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            allowClear
          />
          
          <Select
            placeholder="Filtrar por categoría"
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            allowClear
          >
            {categories.map(category => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Tipo de evento"
            value={filters.eventType}
            onChange={(value) => handleFilterChange('eventType', value)}
            allowClear
          >
            <Option value="free">Gratuito</Option>
            <Option value="paid">De pago</Option>
          </Select>
        </div>
      </Card>

      {filteredEvents.length === 0 ? (
        <Empty
          description="No se encontraron eventos"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredEvents.map(event => (
            <Col key={event.id} xs={24} sm={12} lg={8} xl={6}>
              <EventCard event={event} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default EventsPage
```

#### src/app/events/create/page.tsx ✅ **IMPLEMENTADO**
```typescript
'use client'

import React, { useState } from 'react'
import { message } from 'antd'
import { useRouter } from 'next/navigation'
import EventForm from '@/components/EventForm'
import { EventFormData, Event } from '@/types/event'

const CreateEventPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: EventFormData) => {
    setLoading(true)
    
    try {
      const newEvent: Event = {
        id: Date.now().toString(),
        ...formData,
        capacity: typeof formData.capacity === 'string' ? parseInt(formData.capacity) || 0 : formData.capacity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const existingEvents = JSON.parse(localStorage.getItem('events') || '[]')
      const updatedEvents = [...existingEvents, newEvent]
      localStorage.setItem('events', JSON.stringify(updatedEvents))

      message.success('¡Evento creado exitosamente!')
      router.push('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      message.error('Error al crear el evento. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear Nuevo Evento</h1>
          <p className="text-gray-600">Organiza un evento comunitario de intercambio y sostenibilidad</p>
        </div>
        
        <EventForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

export default CreateEventPage
```

## Configuración de Docker

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: greenloop
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - greenloop-network

  # Redis para cache y sesiones
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - greenloop-network

  # Backend FastAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/greenloop
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=your-secret-key-here
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - uploads:/app/uploads
    networks:
      - greenloop-network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend Next.js
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3009:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - greenloop-network
    command: npm run dev

  # Celery Worker
  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/greenloop
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    networks:
      - greenloop-network
    command: celery -A app.celery_app worker --loglevel=info

volumes:
  postgres_data:
  redis_data:
  uploads:

networks:
  greenloop-network:
    driver: bridge
```

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 8000

# Comando por defecto
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### frontend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
```

## Variables de Entorno

### backend/.env.example
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenloop
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenloop_test

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Environment
ENVIRONMENT=development
DEBUG=true
```

### frontend/.env.local.example
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_ENVIRONMENT=development
```

## Scripts de Desarrollo

### Makefile
```makefile
.PHONY: help dev build test clean

help:
	@echo "Comandos disponibles:"
	@echo "  dev      - Iniciar entorno de desarrollo"
	@echo "  build    - Construir imágenes Docker"
	@echo "  test     - Ejecutar tests"
	@echo "  clean    - Limpiar contenedores y volúmenes"
	@echo "  migrate  - Ejecutar migraciones de base de datos"

dev:
	docker-compose up -d

build:
	docker-compose build

test:
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

clean:
	docker-compose down -v
	docker system prune -f

migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python scripts/seed_data.py
```

Esta especificación técnica proporciona una base sólida para implementar la plataforma de trueque sostenible con todas las tecnologías mencionadas y las mejores prácticas de desarrollo.