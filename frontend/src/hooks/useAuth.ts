'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User, Company, LoginForm, RegisterForm, CompanyLoginForm, CompanyRegisterForm } from '@/types';

interface AuthContextType {
  user: User | Company | null;
  loading: boolean;
  error: string | null;
  userType: 'user' | 'company' | null;
  isAdmin: boolean;
  login: (credentials: LoginForm, type?: 'user' | 'company') => Promise<void>;
  register: (userData: RegisterForm | CompanyRegisterForm, type?: 'user' | 'company') => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User> | Partial<Company>) => Promise<void>;
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
  const [user, setUser] = useState<User | Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'user' | 'company' | null>(null);

  // Verificar si hay un token guardado al cargar la aplicación
  useEffect(() => {
    const token = getCookie('auth_token') || localStorage.getItem('access_token');
    const storedUserType = localStorage.getItem('user_type');
    
    if (token) {
      // Verificar si el token es válido
      checkAuthStatus(storedUserType as 'user' | 'company' | null);
    } else {
      // No hay token, asegurarse de que el usuario esté desconectado
      setUser(null);
      setUserType(null);
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (type: 'user' | 'company' | null) => {
    try {
      if (type === 'company') {
        const companyData: Company = await api.companyAuth.me();
        setUser(companyData);
        setUserType('company');
      } else {
        // Por defecto, intentar como usuario normal
        const userData: User = await api.auth.me();
        setUser(userData);
        setUserType('user');
      }
    } catch (err) {
      // Token inválido, limpiar
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_type');
      deleteCookie('auth_token');
      setUser(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginForm, type: 'user' | 'company' = 'user') => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (type === 'company') {
        response = await api.companyAuth.login(credentials);
        localStorage.setItem('user_type', 'company');
        
        // Guardar el token en localStorage y cookie
        // La respuesta del backend tiene access_token directamente en la raíz
        localStorage.setItem('access_token', response.access_token);
        setCookie('auth_token', response.access_token, 7); // 7 días
        
        // Obtener datos de la empresa
        const companyData: Company = await api.companyAuth.me();
        setUser(companyData);
        setUserType('company');
      } else {
        response = await api.auth.login(credentials);
        localStorage.setItem('user_type', 'user');
        
        // Guardar el token en localStorage y cookie
        localStorage.setItem('access_token', response.tokens.access_token);
        setCookie('auth_token', response.tokens.access_token, 7); // 7 días
        
        // Obtener datos del usuario
        const userData: User = await api.auth.me();
        setUser(userData);
        setUserType('user');
      }
    } catch (err) {
      // Capturar y formatear el error
      let errorMessage = 'Error al iniciar sesión';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Mejorar mensajes de error comunes
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          errorMessage = 'El servicio no está disponible en este momento. Inténtalo más tarde.';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterForm | CompanyRegisterForm, type: 'user' | 'company' = 'user') => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (type === 'company') {
        try {
          response = await api.companyAuth.register(userData as CompanyRegisterForm);
          localStorage.setItem('user_type', 'company');
          
          // Guardar el token en localStorage y cookie
          // La respuesta del backend tiene access_token directamente en la raíz
          localStorage.setItem('access_token', response.access_token);
          setCookie('auth_token', response.access_token, 7); // 7 días
          
          // Obtener datos de la empresa
          const companyInfo: Company = await api.companyAuth.me();
          setUser(companyInfo);
          setUserType('company');
        } catch (error) {
          console.error('Error en registro de empresa:', error);
          // Propagar el error para que se maneje en la interfaz de usuario
          throw error;
        }
      } else {
        try {
          response = await api.auth.register(userData as RegisterForm);
          localStorage.setItem('user_type', 'user');
          
          // Guardar el token en localStorage y cookie
          localStorage.setItem('access_token', response.tokens.access_token);
          setCookie('auth_token', response.tokens.access_token, 7); // 7 días
          
          // Obtener datos del usuario
          const userInfo: User = await api.auth.me();
          setUser(userInfo);
          setUserType('user');
        } catch (error) {
          console.error('Error en registro de usuario:', error);
          // Propagar el error para que se maneje en la interfaz de usuario
          throw error;
        }
      }
    } catch (err) {
      // Capturar y formatear el error
      let errorMessage = 'Error al registrarse';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Mejorar mensajes de error comunes
        if (errorMessage.includes('El email ya está registrado')) {
          errorMessage = 'Este email ya está registrado. Por favor, utiliza otro email o inicia sesión.';
        } else if (errorMessage.includes('El nombre de usuario ya está en uso')) {
          errorMessage = 'Este nombre de usuario ya está en uso. Por favor, elige otro nombre de usuario.';
        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          errorMessage = 'El servicio no está disponible en este momento. Inténtalo más tarde.';
        } else if (errorMessage.includes('contraseñas no coinciden')) {
          errorMessage = 'Las contraseñas no coinciden. Por favor, verifica que sean iguales.';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      // Llamar al endpoint de logout según el tipo de usuario
      if (userType === 'company') {
        api.companyAuth.logout();
      } else {
        api.auth.logout();
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Eliminar token del localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_type');
      
      // Eliminar cookie de autenticación
      deleteCookie('auth_token');
      
      // Limpiar el estado de usuario y errores
      setUser(null);
      setUserType(null);
      setError(null);
      
      // Redirigir a la página principal
      window.location.href = '/';
    }
  };

  const updateUser = async (userData: Partial<User> | Partial<Company>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (userType === 'company') {
        // Aquí iría la lógica para actualizar el perfil de la empresa
        // Por ahora, asumimos que no existe este endpoint
        throw new Error('Actualización de perfil de empresa no implementada');
      } else {
        const updatedUser: User = await api.users.updateProfile(userData as Partial<User>);
        setUser(updatedUser);
      }
    } catch (err) {
      // Capturar y formatear el error
      let errorMessage = 'Error al iniciar sesión';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Mejorar mensajes de error comunes
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          errorMessage = 'El servicio no está disponible en este momento. Inténtalo más tarde.';
        } else if (errorMessage.includes('cuenta desactivada') || errorMessage.includes('disabled')) {
          errorMessage = 'Tu cuenta ha sido desactivada. Por favor, contacta con soporte.';
        }
      }
      
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
    userType,
    isAdmin: !!(user && (user as User).is_admin && userType === 'user'),
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