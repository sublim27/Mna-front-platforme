import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import type { Severity } from '../../config/siem-config';

type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';

type BackendIncident = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus | string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendAlert = {
  id: string;
  title: string;
  severity: Severity;
  clientId: string;
  timestamp: string;
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
};

export type IncidentView = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  tlp: 'RED' | 'AMBER' | 'GREEN' | 'WHITE';
  clientId: string;
};

export type IncidentClient = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
  industry: string;
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

function normalizeIncidentStatus(value: string): IncidentStatus {
  if (value === 'resolved' || value === 'contained' || value === 'investigating' || value === 'open') {
    return value;
  }
  return 'open';
}

function tlpFromSeverity(severity: Severity): 'RED' | 'AMBER' | 'GREEN' | 'WHITE' {
  if (severity === 'critical') return 'RED';
  if (severity === 'high') return 'AMBER';
  if (severity === 'medium') return 'GREEN';
  return 'WHITE';
}

function categoryFromSeverity(severity: Severity) {
  if (severity === 'critical') return 'Priority Incident';
  if (severity === 'high') return 'Threat Investigation';
  if (severity === 'medium') return 'Security Event';
  return 'Operational';
}

const UNKNOWN_CLIENT_ID = 'unknown-client';

const UNKNOWN_CLIENT: IncidentClient = {
  id: UNKNOWN_CLIENT_ID,
  name: 'Shared Tenant',
  shortName: 'Shared',
  color: '#64748B',
  bgColor: '#F1F5F9',
  initials: 'SH',
  industry: 'N/A',
};

export function useIncidentsData(selectedClient: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<IncidentView[]>([]);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [clientsById, setClientsById] = useState<Record<string, IncidentClient>>({
    [UNKNOWN_CLIENT_ID]: UNKNOWN_CLIENT,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [incidentsRes, alertsRes, clientsRes] = await Promise.allSettled([
          apiFetch<BackendIncident[]>('/api/incidents'),
          apiFetch<AlertsListResponse>('/api/alerts?limit=400&page=1&order=desc'),
          apiFetch<BackendClient[]>('/api/clients'),
        ]);

        if (!active) return;

        if (incidentsRes.status === 'fulfilled') {
          const mapped = (incidentsRes.value ?? []).map((incident) => ({
            id: incident.id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            status: normalizeIncidentStatus(incident.status),
            assignee: incident.assignedTo?.trim() || 'Unassigned',
            createdAt: incident.createdAt,
            updatedAt: incident.updatedAt,
            category: categoryFromSeverity(incident.severity),
            tlp: tlpFromSeverity(incident.severity),
            clientId: UNKNOWN_CLIENT_ID,
          }));
          setIncidents(mapped);
        } else {
          throw incidentsRes.reason;
        }

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data ?? []);
        } else {
          setAlerts([]);
        }

        if (clientsRes.status === 'fulfilled') {
          const mappedClients = Object.fromEntries(
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
              },
            ]),
          ) as Record<string, IncidentClient>;

          setClientsById({
            ...mappedClients,
            [UNKNOWN_CLIENT_ID]: UNKNOWN_CLIENT,
          });
        } else {
          setClientsById({ [UNKNOWN_CLIENT_ID]: UNKNOWN_CLIENT });
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function updateIncidentStatus(id: string, status: IncidentStatus) {
    setActionLoadingId(id);
    setActionError('');
    try {
      const updated = await apiPatch<BackendIncident>(`/api/incidents/${id}/status`, { status });
      const normalized = normalizeIncidentStatus(updated.status);
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === id
            ? {
                ...incident,
                status: normalized,
                updatedAt: updated.updatedAt,
                assignee: updated.assignedTo?.trim() || incident.assignee,
              }
            : incident,
        ),
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update incident status');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }

  return useMemo(() => {
    const hasSelectedClient =
      selectedClient !== 'all' && incidents.some((incident) => incident.clientId === selectedClient);

    const activeClientId = hasSelectedClient ? selectedClient : null;

    const filteredIncidents = activeClientId
      ? incidents.filter((incident) => incident.clientId === activeClientId)
      : incidents;

    const relatedAlertsByIncident = Object.fromEntries(
      filteredIncidents.map((incident) => [
        incident.id,
        alerts
          .filter((alert) => alert.severity === incident.severity)
          .slice(0, 3),
      ]),
    ) as Record<string, BackendAlert[]>;

    return {
      loading,
      error,
      actionError,
      actionLoadingId,
      incidents: filteredIncidents,
      clientsById,
      relatedAlertsByIncident,
      updateIncidentStatus,
    };
  }, [actionError, actionLoadingId, alerts, clientsById, error, incidents, loading, selectedClient]);
}
