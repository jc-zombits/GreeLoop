'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page: React.FC<PageProps> = ({ params }) => {
  const { id } = React.use(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Módulo no disponible</CardTitle>
          </CardHeader>
          <CardContent>
            {/* cSpell:disable-next-line */}
            <p className="text-gray-700">
              El módulo &quot;{id}&quot; todavía no está disponible como página dedicada.
            </p>
            <p className="text-gray-700 mt-2">Selecciona un módulo desde la página de educación.</p>
            <Link href="/education">
              <Button className="mt-4">Volver a Educación</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;