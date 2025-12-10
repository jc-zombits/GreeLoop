'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface RedemptionItem {
  reward_id?: string;
  reward_name?: string;
  category?: string;
  points_cost: number;
  created_at: string;
}

export default function RewardsHistoryPage() {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = React.useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const resp = await api.users.getRewardRedemptionsList(p, pageSize);
      setItems(resp.items);
      setTotalPages(resp.total_pages);
      setPage(resp.page);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    load(1);
  }, [load]);

  const onPrev = () => {
    if (page > 1) load(page - 1);
  };
  const onNext = () => {
    if (page < totalPages) load(page + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Historial de Redenciones</h1>
          <Link href="/dashboard">
            <Button variant="outline">Volver al Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-600">Cargando...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-600">No hay redenciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {items.map((r, idx) => {
                  const d = r.created_at ? new Date(r.created_at) : null;
                  const dateStr = d ? d.toLocaleString() : '';
                  return (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{r.reward_name || 'Recompensa'}</span>
                        {r.category ? <span>{` · ${r.category}`}</span> : null}
                        {dateStr ? <span>{` · ${dateStr}`}</span> : null}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">-{r.points_cost} pts</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>Anterior</Button>
              <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>Siguiente</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

