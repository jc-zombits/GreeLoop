'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Bell, Settings, LogOut, Plus, Search, ChevronDown, Gift, Users, Calendar, BookOpen, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { isUser } from '@/types';
import { cn } from '@/lib/utils';

const publicNavigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Explorar', href: '/explore' },
  { name: 'Categorías', href: '/categories' },
  { name: 'Cómo Funciona', href: '/how-it-works' },
  { name: 'Comunidad', href: '/community' },
];

const privateNavigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Mis Items', href: '/items' },
  { name: 'Intercambios', href: '/exchanges' },
  { name: 'Mensajes', href: '/messages' },
  { name: 'Comunidad', href: '/community' },
];

// Opciones del menú "Más"
const moreMenuOptions = [
  { name: 'Aprende con Nosotros', href: '/education', icon: BookOpen },
  { name: 'Eventos', href: '/events', icon: Calendar },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, userType, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    if (profileMenuOpen || companyDropdownOpen || moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, companyDropdownOpen, moreMenuOpen]);
  
  // Navegación dinámica según el tipo de usuario
  const getPrivateNavigation = () => {
    if (userType === 'company') {
      return [
        { name: 'Inicio', href: '/' },
        { name: 'Dashboard', href: '/company-dashboard' },
        { name: 'Mensajes', href: '/messages' },
        { name: 'Comunidad', href: '/community' },
      ];
    } else {
      return privateNavigation;
    }
  };

  // Opciones del dropdown para empresas
  const companyDropdownOptions = [
    { name: 'Nueva Contribución', href: '/contributions/new', icon: Plus },
    { name: 'Mis Contribuciones', href: '/contributions', icon: Gift },
    { name: 'Solicitudes Recibidas', href: '/contributions/requests', icon: Users },
    { name: 'Explorar Categorías', href: '/contributions/categories', icon: Calendar },
  ];
  
  const navigation = user ? getPrivateNavigation() : publicNavigation;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/greenloop-logo.svg" alt="GreenLoop" width={32} height={32} />
              <span className="text-xl font-bold text-gray-900">GreenLoop</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                )}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Dropdown para empresas */}
            {userType === 'company' && (
              <div className="relative" ref={companyDropdownRef}>
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                    companyDropdownOpen || ['/contributions', '/contributions/new', '/contributions/requests', '/contributions/categories'].some(path => pathname.startsWith(path))
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  )}
                >
                  Contribuciones
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    companyDropdownOpen ? 'rotate-180' : ''
                  )} />
                </button>
                
                {companyDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {companyDropdownOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Link
                          key={option.name}
                          href={option.href}
                          onClick={() => setCompanyDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {option.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Menú "Más" */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  moreMenuOpen || ['/education', '/events'].some(path => pathname.startsWith(path))
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                )}
              >
                Más
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  moreMenuOpen ? 'rotate-180' : ''
                )} />
              </button>
              
              {moreMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  {moreMenuOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Link
                        key={option.name}
                        href={option.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {option.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Botón dinámico según tipo de usuario */}
                {userType === 'company' && (
                  <Link href="/exchanges">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Search className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Intercambios</span>
                    </Button>
                  </Link>
                )}
                {userType !== 'company' && (!isUser(user) || !user.is_admin) && (
                  <Link href="/items/new">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Publicar</span>
                    </Button>
                  </Link>
                )}

                {/* Botón Admin visible solo para usuarios administradores */}
                {userType !== 'company' && isUser(user) && user.is_admin && (
                  <Link href="/admin">
                    <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                
                {/* Notificaciones */}
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                {/* Perfil */}
                <div className="relative" ref={profileMenuRef}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    onMouseEnter={() => setProfileMenuOpen(true)}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline truncate max-w-[120px] font-medium">
                      {user ? (
                        isUser(user) 
                          ? (user.first_name || user.username)
                          : (user.company_name || user.username)
                      ) : 'Mi Perfil'}
                    </span>
                  </Button>
                  
                  {/* Dropdown menu */}
                  {profileMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                      onMouseEnter={() => setProfileMenuOpen(true)}
                      onMouseLeave={() => setProfileMenuOpen(false)}
                    >
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 inline mr-2" />
                        Mi Perfil
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 inline mr-2" />
                        Configuración
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth?mode=login">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth?mode=register">
                  <Button size="sm">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Opciones del menú "Más" en móvil */}
            {moreMenuOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.name}
                  href={option.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                    pathname === option.href
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {option.name}
                </Link>
              );
            })}
            
            {/* Mobile user actions */}
            <div className="pt-4 border-t border-gray-200">
              {user ? (
                <>
                  <Link
                    href="/items/new"
                    className="block px-3 py-2 rounded-md text-base font-medium text-green-600 bg-green-50 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Publicar Item
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth?mode=login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-green-600 bg-green-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};