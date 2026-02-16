import { apiFetch } from './client.js';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'staff';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiFetch('/api/auth/change-password', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
