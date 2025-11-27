'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current).setView([4.7110, -74.0721], 12); // Bogotá

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([4.7110, -74.0721]).addTo(map);
    marker.bindPopup('GreenLoop - Punto de prueba');

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}