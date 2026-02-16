import { apiFetch } from './client.js';

export interface Item {
  _id: string;
  name: string;
  categoryId: { _id: string; name: string } | string;
  unit: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  supplier?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function getItems(
  token: string,
  params?: { categoryId?: string; lowStock?: boolean; search?: string }
): Promise<Item[]> {
  const q = new URLSearchParams();
  if (params?.categoryId) q.set('categoryId', params.categoryId);
  if (params?.lowStock) q.set('lowStock', 'true');
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const query = q.toString();
  return apiFetch(`/api/items${query ? `?${query}` : ''}`, { token });
}

export function getItem(token: string, id: string): Promise<Item> {
  return apiFetch(`/api/items/${id}`, { token });
}

export function createItem(
  token: string,
  data: {
    name: string;
    categoryId: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    supplier?: string;
    expiryDate?: string;
  }
): Promise<Item> {
  return apiFetch('/api/items', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function updateItem(
  token: string,
  id: string,
  data: Partial<{
    name: string;
    categoryId: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
    supplier: string;
    expiryDate: string;
  }>
): Promise<Item> {
  return apiFetch(`/api/items/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export function deleteItem(token: string, id: string): Promise<void> {
  return apiFetch(`/api/items/${id}`, { method: 'DELETE', token });
}

const getBaseUrl = () => (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || '';

export async function exportItemsCsv(
  token: string,
  params?: { categoryId?: string; lowStock?: boolean; search?: string }
): Promise<void> {
  const q = new URLSearchParams();
  if (params?.categoryId) q.set('categoryId', params.categoryId);
  if (params?.lowStock) q.set('lowStock', 'true');
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const url = `${getBaseUrl()}/api/items/export${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'items.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
