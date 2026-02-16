import { apiFetch } from './client.js';

export interface ApiUser extends Record<string, unknown> {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function getUsers(token: string): Promise<ApiUser[]> {
  return apiFetch('/api/users', { token });
}

export function createUser(
  token: string,
  data: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'staff';
  }
): Promise<ApiUser> {
  return apiFetch('/api/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}
