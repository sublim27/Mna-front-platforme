import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import type { AlertStatus, Severity, SourceType } from '../../config/siem-config';
import { toPublicId } from '../../lib/public-ids';

type BackendAlert = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  clientId: string;
  sourceType: SourceType;
  sourceIp: string | null;
  destIp: string | null;
  timestamp: string;
  rule: string;
  assignee: string | null;
  mitre: string | null;
};

type UpdateAlertPayload = {
  status: AlertStatus;
  assignee?: string;
  notes?: string;
};

type CreateIncidentPayload = {
  title: string;
  description: string;
  severity: Severity;
  assignedTo?: string;
};

type AlertsListResponse = {
  data: BackendAlert[];
};

type BackendClient = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  industry?: string;
  siemTechnology?: string;
};

type UiClient = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
  industry: string;
  siemTechnology: string;
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

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const parsed = await parseJsonBody<{ message?: string }>(res);
    throw new Error(parsed?.message ?? `Request failed: ${res.status}`);
  }

  const data = await parseJsonBody<T>(res);
  if (!data) throw new Error('Invalid API response');
  return data;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const parsed = await parseJsonBody<{ message?: string }>(res);
    throw new Error(parsed?.message ?? `Request failed: ${res.status}`);
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

export function useAlertsData(selectedClient: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [clientsById, setClientsById] = useState<Record<string, UiClient>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [alertsRes, clientsRes] = await Promise.allSettled([
          apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc'),
          apiFetch<BackendClient[]>('/api/clients'),
        ]);

        if (!active) return;

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data ?? []);
        } else {
          throw alertsRes.reason;
        }

        if (clientsRes.status === 'fulfilled') {
          const mapped = Object.fromEntries(
            (clientsRes.value ?? []).map((client) => [
              client.slug,
              {
                id: client.slug,
                name: client.name,
                shortName: client.shortName,
                color: client.color,
                bgColor: withAlpha(client.color, 0.14),
                initials: getInitials(client.shortName || client.name),
                industry: client.industry ?? 'Unknown',
                siemTechnology: client.siemTechnology ?? 'Unknown SIEM',
              },
            ]),
          ) as Record<string, UiClient>;
          setClientsById(mapped);
        } else {
          setClientsById({});
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function updateAlert(id: string, payload: UpdateAlertPayload) {
    setActionLoadingId(id);
    setActionError('');
    try {
      const updated = await apiPatch<BackendAlert>(`/api/alerts/${id}/status`, payload);
      setAlerts((current) => current.map((alert) => (alert.id === id ? updated : alert)));
      return updated;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update alert');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }

  async function assignToMe(alert: BackendAlert, assignee: string) {
    return updateAlert(alert.id, {
      status: alert.status === 'resolved' ? 'investigating' : alert.status,
      assignee,
    });
  }

  async function setStatus(alert: BackendAlert, status: AlertStatus) {
    return updateAlert(alert.id, {
      status,
      assignee: alert.assignee ?? undefined,
    });
  }

  async function createIncidentFromAlert(alert: BackendAlert, assignee?: string) {
    setActionLoadingId(alert.id);
    setActionError('');
    try {
      const payload: CreateIncidentPayload = {
        title: alert.title,
        description: `${alert.description}\n\nSource alert: ${toPublicId('alert', alert.id)}\nRule: ${alert.rule}`,
        severity: alert.severity,
        assignedTo: assignee?.trim() || alert.assignee || undefined,
      };

      const incident = await apiPost('/api/incidents', payload);
      await updateAlert(alert.id, {
        status: alert.status === 'new' ? 'investigating' : alert.status,
        assignee: assignee?.trim() || alert.assignee || undefined,
      });
      return incident;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to create incident');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }

  return useMemo(() => {
    const filteredAlerts = selectedClient === 'all'
      ? alerts
      : alerts.filter((alert) => alert.clientId === selectedClient);

    return {
      loading,
      error,
      actionError,
      actionLoadingId,
      alerts: filteredAlerts,
      clientsById,
      assignToMe,
      setStatus,
      createIncidentFromAlert,
    };
  }, [actionError, actionLoadingId, alerts, clientsById, error, loading, selectedClient]);
}
