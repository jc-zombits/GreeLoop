'use client';

import React from 'react';
import { Upload, Search, MessageCircle, RefreshCw, Shield, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const steps = [
  {
    icon: Upload,
    title: 'Publica tus items',
    description: 'Sube fotos y describe los objetos que quieres intercambiar. Es gratis y fácil.',
    details: [
      'Toma fotos claras de tus objetos',
      'Describe el estado y características',
      'Establece tu ubicación',
      'Publica en segundos'
    ]
  },
  {
    icon: Search,
    title: 'Explora y encuentra',
    description: 'Busca items que te interesen usando filtros por categoría, ubicación y más.',
    details: [
      'Busca por categorías específicas',
      'Filtra por ubicación cercana',
      'Ve el perfil de otros usuarios',
      'Guarda tus favoritos'
    ]
  },
  {
    icon: MessageCircle,
    title: 'Conecta y negocia',
    description: 'Chatea directamente con otros usuarios para acordar los detalles del intercambio.',
    details: [
      'Chat en tiempo real',
      'Propón intercambios',
      'Negocia términos',
      'Acuerda lugar y hora'
    ]
  },
  {
    icon: RefreshCw,
    title: 'Intercambia',
    description: 'Realiza el intercambio en persona y confirma la transacción en la app.',
    details: [
      'Encuentra un lugar seguro',
      'Verifica el estado del objeto',
      'Completa el intercambio',
      'Califica la experiencia'
    ]
  }
];

const benefits = [
  {
    icon: Shield,
    title: 'Seguro y confiable',
    description: 'Sistema de calificaciones y verificación de usuarios para intercambios seguros.'
  },
  {
    icon: Star,
    title: 'Comunidad activa',
    description: 'Miles de usuarios intercambiando objetos y construyendo una economía circular.'
  },
  {
    icon: RefreshCw,
    title: 'Sostenible',
    description: 'Reduce el desperdicio dando nueva vida a objetos que ya no usas.'
  }
];

const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Cómo funciona GreenLoop?
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Intercambiar objetos nunca fue tan fácil. Descubre cómo puedes dar nueva vida a tus cosas 
              y encontrar exactamente lo que necesitas.
            </p>
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Comenzar ahora
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            4 pasos simples para intercambiar
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nuestro proceso está diseñado para ser intuitivo y seguro, 
            permitiéndote intercambiar con confianza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="relative">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir GreenLoop?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Más que una plataforma de intercambio, somos una comunidad comprometida 
              con la sostenibilidad y la economía circular.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <IconComponent className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Es gratis usar GreenLoop?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sí, GreenLoop es completamente gratuito. Puedes publicar items, 
                buscar, chatear e intercambiar sin ningún costo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Cómo garantizan la seguridad?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Tenemos un sistema de calificaciones, verificación de usuarios y 
                recomendamos siempre realizar intercambios en lugares públicos y seguros.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Qué puedo intercambiar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Puedes intercambiar casi cualquier objeto: ropa, libros, electrónicos, 
                deportes, hogar, y mucho más. Solo deben estar en buen estado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Hay límite de intercambios?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                No hay límites. Puedes realizar tantos intercambios como quieras 
                y mantener activos múltiples items al mismo tiempo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para comenzar a intercambiar?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya están disfrutando de una forma 
              más sostenible de conseguir lo que necesitan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                  Crear cuenta gratis
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  Explorar items
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;