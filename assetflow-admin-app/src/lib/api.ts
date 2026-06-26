import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.leafnity.com/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }
  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// ─── Assets ────────────────────────────────────────────────────────────────
export const assetsApi = {
  getAll: () => request<any[]>('/assets'),
  getById: (id: string) => request<any>(`/assets/${id}`),
  create: (data: any) =>
    request<any>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/assets/${id}`, { method: 'DELETE' }),
  assign: (id: string, userId: string) =>
    request<any>(`/assets/${id}/assign`, { method: 'POST', body: JSON.stringify({ userId }) }),
  return: (id: string) =>
    request<any>(`/assets/${id}/return`, { method: 'POST' }),
};

// ─── Tickets ───────────────────────────────────────────────────────────────
export const ticketsApi = {
  getAll: () => request<any[]>('/tickets'),
  getById: (id: string) => request<any>(`/tickets/${id}`),
  create: (data: any) =>
    request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addComment: (id: string, content: string) =>
    request<any>(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// ─── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => request<any[]>('/users'),
  getById: (id: string) => request<any>(`/users/${id}`),
};

// ─── Logs ──────────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: () => request<any[]>('/logs'),
};

// ─── Vendors ───────────────────────────────────────────────────────────────
export const vendorsApi = {
  getAll: () => request<any[]>('/vendors'),
};
