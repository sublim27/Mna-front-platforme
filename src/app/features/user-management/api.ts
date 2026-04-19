import { API_BASE_URL } from '../../config/api';
import type { UserItem } from './types';

const BASE = API_BASE_URL;

type ApiErrorBody = {
  message?: string;
};

async function parseJsonBody<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await parseJsonBody<ApiErrorBody>(res);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  return res;
}

export async function fetchUsers() {
  const res = await apiFetch('/api/users');
  return (await parseJsonBody<UserItem[]>(res)) ?? [];
}

export async function updateUser(id: string, payload: { name: string; role: string }) {
  const res = await apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseJsonBody(res);
}

export async function deleteUser(id: string) {
  const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
  return parseJsonBody(res);
}
