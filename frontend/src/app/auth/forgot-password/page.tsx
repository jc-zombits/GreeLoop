'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un email válido');
      return;
    }
    setLoading(true);
    try {
      await api.auth.requestPasswordReset(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600">GreenLoop</h1>
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Recupera tu contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">Te enviaremos un enlace a tu correo</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          {sent ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-700">
                Si el correo existe, te enviamos un enlace para restablecer tu contraseña.
              </p>
              <Button className="w-full" onClick={() => router.push('/auth?mode=login')}>Volver a iniciar sesión</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                error={error}
                placeholder="tu@email.com"
                icon={Mail}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/auth?mode=login')}>
                Volver
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}