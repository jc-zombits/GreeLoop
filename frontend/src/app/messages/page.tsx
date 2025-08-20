'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la lista de conversaciones
    router.replace('/messages/conversations');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirigiendo a mensajes...</p>
      </div>
    </div>
  );
}