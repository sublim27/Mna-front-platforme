import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

async function parseJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await parseJson<{ message?: string }>(res);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  const data = await parseJson<T>(res);
  if (!data) throw new Error('Invalid API response');
  return data;
}

async function apiPatch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await parseJson<{ message?: string }>(res);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  const data = await parseJson<T>(res);
  if (!data) throw new Error('Invalid API response');
  return data;
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [notifications, unread] = await Promise.all([
        apiGet<NotificationItem[]>('/api/notifications?limit=12'),
        apiGet<{ count: number }>('/api/notifications/unread-count'),
      ]);
      setItems(notifications ?? []);
      setUnreadCount(unread?.count ?? 0);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 25000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiPatch(`/api/notifications/${id}/read`);
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, isRead: true } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // Keep quiet in header UX
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiPatch('/api/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep quiet in header UX
    }
  }, []);

  return useMemo(() => ({
    items,
    unreadCount,
    loading,
    error,
    reload: load,
    markRead,
    markAllRead,
  }), [error, items, load, loading, markAllRead, markRead, unreadCount]);
}

