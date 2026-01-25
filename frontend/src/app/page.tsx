import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Recycle, Users, Leaf, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Intercambia, Reutiliza,{' '}
              <span className="text-green-600">Transforma</span>
            </h1>
            
            <div className="flex justify-center my-8">
              <Image 
                src="/greenloop-logo.svg" 
                alt="GreenLoop Logo" 
                width={100} 
                height={100}
                priority
              />
            </div>

            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              GreenLoop es la plataforma que conecta personas para intercambiar objetos,
              promoviendo la economía circular y reduciendo la acumulación de CO2.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" className="flex items-center gap-2">
                  Comenzar ahora
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg">
                  Saber más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ¿Por qué elegir GreenLoop?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Una plataforma diseñada para hacer el intercambio fácil, seguro y sostenible
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Recycle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Economía Circular</h3>
              <p className="mt-2 text-gray-600">
                Reduce el desperdicio dando nueva vida a objetos que ya no usas
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Comunidad</h3>
              <p className="mt-2 text-gray-600">
                Conecta con personas de tu zona que comparten tus valores sostenibles
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Sostenibilidad</h3>
              <p className="mt-2 text-gray-600">
                Contribuye al cuidado del medio ambiente con cada intercambio
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Crecimiento</h3>
              <p className="mt-2 text-gray-600">
                Forma parte de un movimiento global hacia un futuro más sostenible
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Listo para comenzar tu primer intercambio?
            </h2>
            <p className="mt-4 text-lg text-green-100">
              Únete a miles de usuarios que ya están transformando la forma de consumir
            </p>
            <div className="mt-8">
              <Link href="/auth?mode=register">
                <Button variant="secondary" size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  Crear cuenta gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
