import { apiFetch } from './client.js';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export function getCategories(token: string): Promise<Category[]> {
  return apiFetch('/api/categories', { token });
}

export function createCategory(
  token: string,
  data: { name: string; description?: string }
): Promise<Category> {
  return apiFetch('/api/categories', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  token: string,
  id: string,
  data: { name?: string; description?: string }
): Promise<Category> {
  return apiFetch(`/api/categories/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export function deleteCategory(token: string, id: string): Promise<void> {
  return apiFetch(`/api/categories/${id}`, { method: 'DELETE', token });
}
