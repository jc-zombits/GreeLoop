'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User, LoginForm, RegisterForm } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para manejar cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar si hay un token guardado al cargar la aplicación
  useEffect(() => {
    const token = getCookie('auth_token') || localStorage.getItem('access_token');
    if (token) {
      // Verificar si el token es válido
      checkAuthStatus();
    } else {
      // No hay token, asegurarse de que el usuario esté desconectado
      setUser(null);
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData: User = await api.auth.me();
      setUser(userData);
    } catch (err) {
      // Token inválido, limpiar
      localStorage.removeItem('access_token');
      deleteCookie('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.auth.login(credentials);
      
      // Guardar el token en localStorage y cookie
      localStorage.setItem('access_token', response.tokens.access_token);
      setCookie('auth_token', response.tokens.access_token, 7); // 7 días
      
      // Obtener datos del usuario
      const userData: User = await api.auth.me();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.auth.register(userData);
      
      // Guardar el token en localStorage y cookie
      localStorage.setItem('access_token', response.tokens.access_token);
      setCookie('auth_token', response.tokens.access_token, 7); // 7 días
      
      // Obtener datos del usuario
      const userInfo: User = await api.auth.me();
      setUser(userInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrarse';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Eliminar token del localStorage
    localStorage.removeItem('access_token');
    
    // Eliminar cookie de autenticación
    deleteCookie('auth_token');
    
    // Limpiar el estado de usuario y errores
    setUser(null);
    setError(null);
    
    // Redirigir a la página principal
    window.location.href = '/';
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser: User = await api.users.updateProfile(userData);
      setUser(updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar usuario';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);
  
  return { isAuthenticated: !!user, loading };
};