'use client';

import React, { useState } from 'react';
import { Bell, Shield, Palette, Database, HelpCircle, LogOut, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const settingsSections = [
  {
    id: 'notifications',
    title: 'Notificaciones',
    icon: Bell,
    description: 'Configura cómo y cuándo recibir notificaciones'
  },
  {
    id: 'privacy',
    title: 'Privacidad y Seguridad',
    icon: Shield,
    description: 'Gestiona tu privacidad y configuraciones de seguridad'
  },
  {
    id: 'preferences',
    title: 'Preferencias',
    icon: Palette,
    description: 'Personaliza tu experiencia en GreenLoop'
  },
  {
    id: 'data',
    title: 'Datos y Almacenamiento',
    icon: Database,
    description: 'Controla tus datos y configuraciones de almacenamiento'
  }
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('notifications');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      newsletter: false,
      exchanges: true,
      messages: true,
      marketing: false
    },
    privacy: {
      profilePublic: true,
      showStats: true,
      showLocation: false,
      allowMessages: true,
      dataSharing: false
    },
    preferences: {
      language: 'es',
      theme: 'light',
      verdosoDarkMode: false,
      currency: 'EUR',
      distance: 'km',
      autoSave: true
    },
    data: {
      downloadData: false,
      deleteAccount: false,
      dataRetention: '2years'
    }
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: string, key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar en el backend
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const applyVerdosoDarkMode = (enabled: boolean) => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      body.classList.toggle('admin-bg', enabled);
    }
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Métodos de Notificación</h3>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Notificaciones por email', description: 'Recibe notificaciones importantes por correo electrónico' },
            { key: 'push', label: 'Notificaciones push', description: 'Notificaciones en tiempo real en tu dispositivo' },
            { key: 'sms', label: 'Notificaciones SMS', description: 'Mensajes de texto para eventos críticos' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                  onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificación</h3>
        <div className="space-y-4">
          {[
            { key: 'exchanges', label: 'Intercambios', description: 'Nuevas propuestas y actualizaciones de intercambios' },
            { key: 'messages', label: 'Mensajes', description: 'Nuevos mensajes de otros usuarios' },
            { key: 'newsletter', label: 'Newsletter', description: 'Noticias y actualizaciones de GreenLoop' },
            { key: 'marketing', label: 'Marketing', description: 'Ofertas especiales y promociones' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                  onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visibilidad del Perfil</h3>
        <div className="space-y-4">
          {[
            { key: 'profilePublic', label: 'Perfil público', description: 'Permite que otros usuarios vean tu perfil' },
            { key: 'showStats', label: 'Mostrar estadísticas', description: 'Muestra tus estadísticas de intercambios públicamente' },
            { key: 'showLocation', label: 'Mostrar ubicación exacta', description: 'Comparte tu ubicación precisa con otros usuarios' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy[item.key as keyof typeof settings.privacy]}
                  onChange={(e) => handleSettingChange('privacy', item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comunicación</h3>
        <div className="space-y-4">
          {[
            { key: 'allowMessages', label: 'Permitir mensajes', description: 'Permite que otros usuarios te envíen mensajes' },
            { key: 'dataSharing', label: 'Compartir datos analíticos', description: 'Ayuda a mejorar GreenLoop compartiendo datos anónimos' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy[item.key as keyof typeof settings.privacy]}
                  onChange={(e) => handleSettingChange('privacy', item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
          <select
            value={settings.preferences.language}
            onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
          <select
            value={settings.preferences.theme}
            onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="auto">Automático</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="verdosoDarkMode"
            type="checkbox"
            checked={settings.preferences.verdosoDarkMode}
            onChange={(e) => {
              handleSettingChange('preferences', 'verdosoDarkMode', e.target.checked);
              applyVerdosoDarkMode(e.target.checked);
            }}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="verdosoDarkMode" className="text-sm text-gray-700">Modo verdoso oscuro (Admin)</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
          <select
            value={settings.preferences.currency}
            onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dólar ($)</option>
            <option value="GBP">Libra (£)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Distancia</label>
          <select
            value={settings.preferences.distance}
            onChange={(e) => handleSettingChange('preferences', 'distance', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="km">Kilómetros</option>
            <option value="mi">Millas</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">Guardado automático</p>
          <p className="text-sm text-gray-500">Guarda automáticamente los cambios mientras escribes</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.preferences.autoSave}
            onChange={(e) => handleSettingChange('preferences', 'autoSave', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gestión de Datos</h3>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Descargar mis datos</p>
              <Button variant="outline" size="sm">
                Descargar
              </Button>
            </div>
            <p className="text-sm text-gray-500">Descarga una copia de todos tus datos en formato JSON</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Retención de datos</p>
              <select
                value={settings.data.dataRetention}
                onChange={(e) => handleSettingChange('data', 'dataRetention', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="1year">1 año</option>
                <option value="2years">2 años</option>
                <option value="5years">5 años</option>
                <option value="forever">Indefinido</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">Tiempo que mantenemos tus datos después de eliminar tu cuenta</p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-red-600 mb-4">Zona de Peligro</h3>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-red-900">Eliminar cuenta</p>
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-100">
              Eliminar
            </Button>
          </div>
          <p className="text-sm text-red-700">Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return renderNotifications();
      case 'privacy':
        return renderPrivacy();
      case 'preferences':
        return renderPreferences();
      case 'data':
        return renderData();
      default:
        return renderNotifications();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-gray-600">
            Personaliza tu experiencia en GreenLoop según tus preferencias.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
            
            {/* Quick Actions */}
            <div className="mt-8 space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Ayuda
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </CardTitle>
                <CardDescription>
                  {settingsSections.find(s => s.id === activeSection)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
              {hasChanges && (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">Tienes cambios sin guardar</p>
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}