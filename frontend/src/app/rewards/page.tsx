'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface RewardItem {
  id: string;
  name: string;
  description?: string;
  points_cost: number;
  category?: string;
  image_url?: string | null;
  tier_required?: string;
  stock: number;
}

export default function RewardsRedeemPage() {
  const [points, setPoints] = useState<number>(0);
  const [tier, setTier] = useState<string>('Bronce');
  const [catalog, setCatalog] = useState<RewardItem[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.users.getRewards();
        setPoints(r.points);
        setTier(r.tier);
      } catch {}
      try {
        const items = await api.users.getRewardsCatalog();
        setCatalog(items);
      } catch {}
    };
    load();
  }, []);

  const handleRedeem = async (item: RewardItem) => {
    setRedeemingId(item.id);
    try {
      const resp = await api.users.redeemReward({ reward_id: item.id });
      setPoints(resp.points_remaining);
      setTier(resp.tier);
      setMessage(resp.message || 'Canje realizado exitosamente');
      setTimeout(() => setMessage(null), 4000);
      setRedeemingId(null);
    } catch {
      setRedeemingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Redimir Puntos</h1>
            <p className="text-gray-600">Tus puntos: <span className="font-semibold">{points}</span> · Nivel: <span className="font-semibold">{tier}</span></p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Volver al Dashboard</Button>
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {message}
          </div>
        )}

        {/* Categorías */}
        {catalog.length > 0 ? (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {["Todas", ...Array.from(new Set(catalog.map(c => c.category || 'General')))].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Button
                    key={cat}
                    variant={active ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}

        {catalog.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
            No hay recompensas disponibles en este momento.
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Cupones', 'Descuentos', 'Productos', 'Servicios'].map((cat) => (
                <Card key={cat}>
                  <CardHeader>
                    <CardTitle>{cat}</CardTitle>
                    <CardDescription>Próximamente</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog
              .filter((item) => selectedCategory === 'Todas' ? true : (item.category || 'General') === selectedCategory)
              .map((item) => {
              const canRedeem = points >= item.points_cost;
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{item.name}</CardTitle>
                      <Badge variant={canRedeem ? 'success' : 'default'}>{item.category || 'Recompensa'}</Badge>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {item.image_url ? (
                      <div className="mb-3 rounded-md overflow-hidden">
                        <Image src={item.image_url} alt={item.name} width={400} height={240} className="w-full h-40 object-cover" />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Costo</div>
                      <div className="text-lg font-semibold text-gray-900">{item.points_cost} pts</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!canRedeem || redeemingId === item.id}
                      onClick={() => handleRedeem(item)}
                    >
                      {redeemingId === item.id ? 'Procesando...' : canRedeem ? 'Canjear' : 'Insuficientes puntos'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
