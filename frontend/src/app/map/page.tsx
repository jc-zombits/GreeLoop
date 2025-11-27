'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MapView = dynamic(() => import('../../components/MapView'), { ssr: false });

export default function MapPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Mapa de Intercambios</h1>
      <p className="text-gray-600 mb-4">Visualización básica con Leaflet/React-Leaflet.</p>
      <div className="h-[600px]">
        <MapView />
      </div>
    </div>
  );
}