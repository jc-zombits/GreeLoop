'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ErrorModal } from '@/components/ui/ErrorModal';
import { SuccessModal } from '@/components/ui/SuccessModal';

type AuthMode = 'login' | 'register';
type UserType = 'user' | 'company';

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  // Detectar el modo desde los parámetros de consulta
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'register') {
      setMode('register');
    }
  }, [searchParams]);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    user_type: 'user' as UserType
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    accept_terms: false,
    accept_privacy: false,
    user_type: 'user' as UserType,
    
    // Campos específicos para usuarios
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    
    // Campos específicos para empresas
    company_name: '',
    tax_id: '',
    industry: '',
    company_size: '',
    collaboration_type: ''
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setLoginForm(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setLoginForm(prev => ({ ...prev, user_type: type }));
    setRegisterForm(prev => ({ ...prev, user_type: type }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setRegisterForm(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    if (!loginForm.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!loginForm.password) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    
    if (!registerForm.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (registerForm.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (registerForm.user_type === 'user') {
      if (!registerForm.first_name.trim()) {
        newErrors.first_name = 'El nombre es requerido';
      }
      
      if (!registerForm.last_name.trim()) {
        newErrors.last_name = 'El apellido es requerido';
      }
    } else if (registerForm.user_type === 'company') {
      if (!registerForm.company_name.trim()) {
        newErrors.company_name = 'El nombre de la empresa es requerido';
      }
    }
    
    if (!registerForm.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!registerForm.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (registerForm.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (!registerForm.confirm_password) {
      newErrors.confirm_password = 'Confirma tu contraseña';
    } else if (registerForm.password !== registerForm.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden';
    }
    
    if (!registerForm.accept_terms) {
      newErrors.accept_terms = 'Debes aceptar los términos y condiciones';
    }
    
    if (!registerForm.accept_privacy) {
      newErrors.accept_privacy = 'Debes aceptar la política de privacidad';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    try {
      await login(loginForm, loginForm.user_type);
      
      // Mostrar mensaje de éxito según el tipo de usuario
      const successMessage = userType === 'company' 
        ? 'Inicio de sesión exitoso. Bienvenido/a de nuevo.'
        : 'Inicio de sesión exitoso. Bienvenido/a de nuevo.';
      
      // Mostrar modal de éxito antes de redirigir
      setSuccessModalMessage(successMessage);
      setShowSuccessModal(true);
      
      // Redirigir al dashboard correspondiente después de un breve retraso
      setTimeout(() => {
        if (loginForm.user_type === 'company') {
          router.push('/company-dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Login error:', err);
      
      // Extraer el mensaje de error específico
      let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (err instanceof Error) {
        // Verificar si es un error de credenciales incorrectas
        if (err.message.includes('Credenciales incorrectas')) {
          errorMsg = 'Email o contraseña incorrectos. Por favor, verifica tus datos.';
        }
        // Verificar si es un error de cuenta desactivada
        else if (err.message.includes('Cuenta desactivada')) {
          errorMsg = 'Tu cuenta está desactivada. Contacta con soporte para más información.';
        }
        // Para otros errores, mostrar el mensaje tal cual
        else if (err.message) {
          errorMsg = err.message;
        }
      }
      
      // Mostrar el error en el modal en lugar de en el formulario
      setErrorModalMessage(errorMsg);
      setShowErrorModal(true);
      // También mantener el error en el estado para mostrarlo en el formulario si es necesario
      setErrors({ general: errorMsg });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) return;
    
    try {
      await register(registerForm, userType);
      
      // Mostrar mensaje de éxito según el tipo de usuario
      const successMessage = userType === 'company' 
        ? 'Empresa registrada exitosamente. Bienvenido/a al dashboard.'
        : 'Cuenta creada exitosamente. Bienvenido/a al dashboard.';
      
      // Mostrar modal de éxito antes de redirigir
      setSuccessModalMessage(successMessage);
      setShowSuccessModal(true);
      
      // Redirigir al dashboard correspondiente después de un breve retraso
      setTimeout(() => {
        if (userType === 'company') {
          router.push('/company-dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Register error:', err);
      // Extraer el mensaje de error específico
      let errorMsg = 'Error al crear la cuenta. Inténtalo de nuevo.';
      
      if (err instanceof Error) {
        // Verificar si es un error de email ya registrado
        if (err.message.includes('El email ya está registrado')) {
          errorMsg = 'Este email ya está registrado. Por favor, utiliza otro email o inicia sesión.';
        } 
        // Verificar si es un error de nombre de usuario ya en uso
        else if (err.message.includes('El nombre de usuario ya está en uso')) {
          errorMsg = 'Este nombre de usuario ya está en uso. Por favor, elige otro nombre de usuario.';
        }
        // Para otros errores, mostrar el mensaje tal cual
        else if (err.message) {
          errorMsg = err.message;
        }
      }
      
      setErrors({ general: errorMsg });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Modal de Error */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorModalMessage}
      />
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successModalMessage}
      />
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-green-600">GreenLoop</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' 
              ? 'Accede a tu cuenta para continuar intercambiando'
              : 'Únete a la comunidad de intercambio sostenible'
            }
          </p>
        </div>
        
        {/* User Type Selector */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => handleUserTypeChange('user')}
            className={`flex items-center px-4 py-2 rounded-lg ${userType === 'user' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <User className="h-5 w-5 mr-2" />
            <span>Usuario</span>
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeChange('company')}
            className={`flex items-center px-4 py-2 rounded-lg ${userType === 'company' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Building2 className="h-5 w-5 mr-2" />
            <span>Empresa</span>
          </button>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                error={errors.email}
                placeholder="tu@email.com"
                icon={Mail}
              />
              
              <div className="relative">
                <Input
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  error={errors.password}
                  placeholder="Tu contraseña"
                  icon={Lock}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Iniciando sesión...' : `Iniciar Sesión como ${userType === 'user' ? 'Usuario' : 'Empresa'}`}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <Input
                label="Nombre de usuario"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                error={errors.username}
                placeholder="Tu nombre de usuario"
                icon={User}
              />
              
              {userType === 'user' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nombre"
                      name="first_name"
                      value={registerForm.first_name}
                      onChange={handleRegisterChange}
                      error={errors.first_name}
                      placeholder="Tu nombre"
                      icon={User}
                    />
                    
                    <Input
                      label="Apellido"
                      name="last_name"
                      value={registerForm.last_name}
                      onChange={handleRegisterChange}
                      error={errors.last_name}
                      placeholder="Tu apellido"
                      icon={User}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Input
                    label="Nombre de la Empresa"
                    name="company_name"
                    value={registerForm.company_name}
                    onChange={handleRegisterChange}
                    error={errors.company_name}
                    placeholder="Nombre de tu empresa"
                    icon={Building2}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="NIF/CIF (opcional)"
                      name="tax_id"
                      value={registerForm.tax_id}
                      onChange={handleRegisterChange}
                      placeholder="Identificación fiscal"
                      icon={Briefcase}
                    />
                    
                    <Input
                      label="Industria (opcional)"
                      name="industry"
                      value={registerForm.industry}
                      onChange={handleRegisterChange}
                      placeholder="Sector de actividad"
                      icon={Briefcase}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      name="company_size"
                      value={registerForm.company_size}
                      onChange={handleRegisterChange}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-600 placeholder-gray-500"
                    >
                      <option value="" className="text-gray-500">Tamaño de empresa</option>
                      <option value="Pequeña" className="text-gray-600">Pequeña (1-49 empleados)</option>
                      <option value="Mediana" className="text-gray-600">Mediana (50-249 empleados)</option>
                      <option value="Grande" className="text-gray-600">Grande (250+ empleados)</option>
                    </select>
                    
                    <select
                    name="collaboration_type"
                    value={registerForm.collaboration_type || ''}
                    onChange={handleRegisterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-gray-600 placeholder-gray-500"
                  >
                    <option value="" className="text-gray-500">Tipo de colaboración</option>
                    <option value="sponsor" className="text-gray-600">Patrocinador</option>
                    <option value="developer" className="text-gray-600">Desarrollador</option>
                    <option value="collector" className="text-gray-600">Recolector</option>
                    <option value="exchange" className="text-gray-600">Intercambio</option>
                    <option value="other" className="text-gray-600">Otro</option>
                  </select>
                  </div>
                </>
              )}
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                error={errors.email}
                placeholder="tu@email.com"
                icon={Mail}
              />
              
              <Input
                label="Teléfono (opcional)"
                name="phone"
                value={registerForm.phone}
                onChange={handleRegisterChange}
                placeholder="+34 612 345 678"
                icon={Phone}
              />
              
              {userType === 'user' && (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Ciudad (opcional)"
                    name="city"
                  value={registerForm.city}
                    onChange={handleRegisterChange}
                    placeholder="Madrid"
                    icon={MapPin}
                  />
                  
                  <Input
                    label="Estado (opcional)"
                    name="state"
                    value={registerForm.state}
                    onChange={handleRegisterChange}
                    placeholder="Madrid"
                    icon={MapPin}
                  />
                  
                  <Input
                    label="País (opcional)"
                    name="country"
                    value={registerForm.country}
                    onChange={handleRegisterChange}
                    placeholder="España"
                    icon={MapPin}
                  />
                </div>
              )}
              
              <div className="relative">
                <Input
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  error={errors.password}
                  placeholder="Mínimo 8 caracteres"
                  icon={Lock}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              <Input
                label="Confirmar contraseña"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={registerForm.confirm_password}
                onChange={handleRegisterChange}
                error={errors.confirm_password}
                placeholder="Repite tu contraseña"
                icon={Lock}
              />
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="accept_terms"
                    checked={registerForm.accept_terms}
                    onChange={handleRegisterChange}
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Acepto los{' '}
                    <button type="button" className="text-green-600 hover:text-green-700">
                      términos y condiciones
                    </button>
                  </span>
                </div>
                {errors.accept_terms && (
                  <p className="text-red-500 text-xs">{errors.accept_terms}</p>
                )}
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="accept_privacy"
                    checked={registerForm.accept_privacy}
                    onChange={handleRegisterChange}
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Acepto la{' '}
                    <button type="button" className="text-green-600 hover:text-green-700">
                      política de privacidad
                    </button>
                  </span>
                </div>
                {errors.accept_privacy && (
                  <p className="text-red-500 text-xs">{errors.accept_privacy}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creando cuenta...' : `Crear Cuenta de ${userType === 'user' ? 'Usuario' : 'Empresa'}`}
              </Button>
            </form>
          )}

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrors({});
                }}
                className="font-medium text-green-600 hover:text-green-700"
              >
                {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}