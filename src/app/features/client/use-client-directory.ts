import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

type BackendClient = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  industry?: string;
  siemTechnology?: string;
  stats?: {
    total: number;
    critical: number;
    high: number;
    open: number;
  };
};

type BackendAlert = {
  clientId: string;
  severity: string;
};

type AlertsListResponse = {
  data: BackendAlert[];
};

export type DirectoryClient = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
  industry: string;
  siemTechnology: string;
  openAlerts: number;
  criticalAlerts: number;
  status: 'healthy' | 'warning' | 'critical';
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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await parseJsonBody<{ message?: string }>(res);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  const data = await parseJsonBody<T>(res);
  if (!data) throw new Error('Invalid API response');
  return data;
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '#F1F5F9';
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function toStatus(openAlerts: number, criticalAlerts: number): DirectoryClient['status'] {
  if (criticalAlerts > 0) return 'critical';
  if (openAlerts > 0) return 'warning';
  return 'healthy';
}

function titleFromClientId(clientId: string) {
  return clientId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function colorFromClientId(clientId: string) {
  const palette = ['#1AABBA', '#CB5229', '#2563EB', '#10B981', '#C8980E', '#8B5CF6', '#E07820', '#0EA5E9'];
  const hash = clientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function mapClients(clients: BackendClient[]): Record<string, DirectoryClient> {
  return Object.fromEntries(
    clients.map((client) => {
      const openAlerts = client.stats?.open ?? 0;
      const criticalAlerts = client.stats?.critical ?? 0;
      const color = client.color || '#1AABBA';
      return [
        client.slug,
        {
          id: client.slug,
          name: client.name,
          shortName: client.shortName || client.name,
          color,
          bgColor: withAlpha(color, 0.14),
          initials: getInitials(client.shortName || client.name),
          industry: client.industry ?? 'Unknown',
          siemTechnology: client.siemTechnology ?? 'Wazuh',
          openAlerts,
          criticalAlerts,
          status: toStatus(openAlerts, criticalAlerts),
        },
      ];
    }),
  ) as Record<string, DirectoryClient>;
}

function mapFromAlerts(alerts: BackendAlert[]): Record<string, DirectoryClient> {
  const counts = alerts.reduce<Record<string, { openAlerts: number; criticalAlerts: number }>>((acc, alert) => {
    if (!acc[alert.clientId]) {
      acc[alert.clientId] = { openAlerts: 0, criticalAlerts: 0 };
    }
    acc[alert.clientId].openAlerts += 1;
    if (alert.severity === 'critical') {
      acc[alert.clientId].criticalAlerts += 1;
    }
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(counts).map(([clientId, values]) => {
      const color = colorFromClientId(clientId);
      const name = titleFromClientId(clientId);
      return [
        clientId,
        {
          id: clientId,
          name,
          shortName: name,
          color,
          bgColor: withAlpha(color, 0.14),
          initials: getInitials(name),
          industry: 'Unknown',
          siemTechnology: 'Wazuh',
          openAlerts: values.openAlerts,
          criticalAlerts: values.criticalAlerts,
          status: toStatus(values.openAlerts, values.criticalAlerts),
        },
      ];
    }),
  ) as Record<string, DirectoryClient>;
}

export function useClientDirectory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientsById, setClientsById] = useState<Record<string, DirectoryClient>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [clientsRes, alertsRes] = await Promise.allSettled([
          apiFetch<BackendClient[]>('/api/clients'),
          apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc'),
        ]);

        if (!active) return;

        if (clientsRes.status === 'fulfilled' && clientsRes.value.length > 0) {
          setClientsById(mapClients(clientsRes.value));
          return;
        }

        if (alertsRes.status === 'fulfilled') {
          setClientsById(mapFromAlerts(alertsRes.value.data ?? []));
          if (clientsRes.status === 'rejected') {
            setError('Client registry is restricted for this role. Using alert-derived client list.');
          }
          return;
        }

        if (clientsRes.status === 'rejected') throw clientsRes.reason;
        if (alertsRes.status === 'rejected') throw alertsRes.reason;
      } catch (err: unknown) {
        if (!active) return;
        setClientsById({});
        setError(err instanceof Error ? err.message : 'Failed to load client directory');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    const clients = Object.values(clientsById).sort((a, b) => a.name.localeCompare(b.name));
    return {
      loading,
      error,
      clients,
      clientsById,
    };
  }, [clientsById, error, loading]);
}
