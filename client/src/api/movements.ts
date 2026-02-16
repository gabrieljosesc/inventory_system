import { apiFetch } from './client.js';

export interface StockMovement {
  _id: string;
  itemId: { _id: string; name: string; unit: string } | string;
  type: 'in' | 'out';
  quantity: number;
  reason?: string;
  createdAt: string;
}

export function getMovements(
  token: string,
  params?: { itemId?: string; from?: string; to?: string; limit?: number }
): Promise<StockMovement[]> {
  const q = new URLSearchParams();
  if (params?.itemId) q.set('itemId', params.itemId);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return apiFetch(`/api/movements${query ? `?${query}` : ''}`, { token });
}

export function createMovement(
  token: string,
  data: { itemId: string; type: 'in' | 'out'; quantity: number; reason?: string }
): Promise<StockMovement> {
  return apiFetch('/api/movements', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

const getBaseUrl = () => (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || '';

export async function exportMovementsCsv(
  token: string,
  params?: { from?: string; to?: string; itemId?: string }
): Promise<void> {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.itemId) q.set('itemId', params.itemId);
  const url = `${getBaseUrl()}/api/movements/export${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'movements.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
