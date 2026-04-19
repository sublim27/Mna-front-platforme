import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const SOURCE_COLORS: Record<string, string> = {
  firewall: '#1AABBA',
  endpoint: '#CB5229',
  auth: '#F0BC2C',
  ids: '#2563EB',
  waf: '#E07820',
  email: '#10B981',
  cloud: '#8B5CF6',
};

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive';

type BackendAlert = {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sourceType: string;
  clientId: string;
  rule: string;
  timestamp: string;
};

type BackendIncident = {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
};

type BackendClient = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  stats?: {
    total: number;
    critical: number;
    high: number;
    open: number;
  };
};

type AlertsListResponse = {
  data: BackendAlert[];
};

type AlertsStatsResponse = {
  total: number;
  critical: number;
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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '#E6F7F9';
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getHealth(openAlerts: number, criticalAlerts: number): 'healthy' | 'warning' | 'critical' {
  if (criticalAlerts > 0) return 'critical';
  if (openAlerts > 0) return 'warning';
  return 'healthy';
}

function calculateMttr(incidents: BackendIncident[]) {
  const resolved = incidents.filter((incident) => incident.status === 'resolved');
  if (resolved.length === 0) return 'n/a';

  const totalMinutes = resolved.reduce((acc, incident) => {
    const created = new Date(incident.createdAt).getTime();
    const updated = new Date(incident.updatedAt).getTime();
    const diffMinutes = Math.max(0, Math.round((updated - created) / 60000));
    return acc + diffMinutes;
  }, 0);

  const avg = Math.max(1, Math.round(totalMinutes / resolved.length));
  return `${avg} min`;
}

export function useDashboardData(selectedClient: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [incidents, setIncidents] = useState<BackendIncident[]>([]);
  const [clients, setClients] = useState<BackendClient[]>([]);
  const [alertsStats, setAlertsStats] = useState<AlertsStatsResponse>({ total: 0, critical: 0 });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [alertsRes, statsRes, incidentsRes, clientsRes] = await Promise.allSettled([
          apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc'),
          apiFetch<AlertsStatsResponse>('/api/alerts/stats'),
          apiFetch<BackendIncident[]>('/api/incidents'),
          apiFetch<BackendClient[]>('/api/clients'),
        ]);

        if (!active) return;

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data ?? []);
        } else {
          throw alertsRes.reason;
        }

        if (statsRes.status === 'fulfilled') {
          setAlertsStats(statsRes.value);
        } else {
          throw statsRes.reason;
        }

        if (incidentsRes.status === 'fulfilled') {
          setIncidents(incidentsRes.value ?? []);
        } else {
          throw incidentsRes.reason;
        }

        // Clients endpoint is admin-only. When unavailable, keep dashboard functional.
        if (clientsRes.status === 'fulfilled') {
          setClients(clientsRes.value ?? []);
        } else {
          setClients([]);
        }
      } catch (err: unknown) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
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
    const hasSelectedClient =
      selectedClient !== 'all' && clients.some((client) => client.slug === selectedClient);

    const activeClientId = hasSelectedClient ? selectedClient : null;

    const filteredAlerts = activeClientId
      ? alerts.filter((alert) => alert.clientId === activeClientId)
      : alerts;

    const filteredIncidents = activeClientId
      ? incidents.filter((incident) => incident.clientId === activeClientId)
      : incidents;

    const filteredClients = activeClientId
      ? clients.filter((client) => client.slug === activeClientId)
      : clients;

    const clientsById = Object.fromEntries(
      filteredClients.map((client) => {
        const openAlerts = client.stats?.open ?? 0;
        const criticalAlerts = client.stats?.critical ?? 0;

        return [
          client.slug,
          {
            id: client.slug,
            name: client.name,
            shortName: client.shortName,
            color: client.color,
            bgColor: withAlpha(client.color, 0.12),
            initials: getInitials(client.shortName || client.name),
            status: getHealth(openAlerts, criticalAlerts),
            openAlerts,
          },
        ];
      }),
    ) as Record<string, {
      id: string;
      name: string;
      shortName: string;
      color: string;
      bgColor: string;
      initials: string;
      status: 'healthy' | 'warning' | 'critical';
      openAlerts: number;
    }>;

    const trendMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();
    const trendLabels: string[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      trendMap.set(key, { critical: 0, high: 0, medium: 0, low: 0 });
      trendLabels.push(key);
    }

    filteredAlerts.forEach((alert) => {
      const key = new Date(alert.timestamp).toISOString().slice(0, 10);
      const bucket = trendMap.get(key);
      if (!bucket) return;

      if (alert.severity === 'critical') bucket.critical += 1;
      else if (alert.severity === 'high') bucket.high += 1;
      else if (alert.severity === 'medium') bucket.medium += 1;
      else bucket.low += 1;
    });

    const alertTrendData = trendLabels.map((key) => {
      const date = new Date(`${key}T00:00:00`);
      const bucket = trendMap.get(key) ?? { critical: 0, high: 0, medium: 0, low: 0 };
      return {
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        ...bucket,
      };
    });

    const sourceCounts = filteredAlerts.reduce<Record<string, number>>((acc, alert) => {
      acc[alert.sourceType] = (acc[alert.sourceType] ?? 0) + 1;
      return acc;
    }, {});

    const sourceTotal = Object.values(sourceCounts).reduce((acc, value) => acc + value, 0);

    const sourceDistribution = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        name: source.charAt(0).toUpperCase() + source.slice(1),
        value: sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0,
        color: SOURCE_COLORS[source] ?? '#94A3B8',
      }))
      .sort((a, b) => b.value - a.value);

    const clientAgg = filteredAlerts.reduce<
      Record<string, { critical: number; high: number; medium: number; low: number }>
    >((acc, alert) => {
      if (!acc[alert.clientId]) {
        acc[alert.clientId] = { critical: 0, high: 0, medium: 0, low: 0 };
      }

      if (alert.severity === 'critical') acc[alert.clientId].critical += 1;
      else if (alert.severity === 'high') acc[alert.clientId].high += 1;
      else if (alert.severity === 'medium') acc[alert.clientId].medium += 1;
      else acc[alert.clientId].low += 1;

      return acc;
    }, {});

    const clientAlertCounts = Object.entries(clientAgg)
      .map(([clientId, counts]) => {
        const client = clientsById[clientId];
        return {
          client: client?.shortName ?? clientId,
          ...counts,
        };
      })
      .sort((a, b) => b.critical + b.high + b.medium + b.low - (a.critical + a.high + a.medium + a.low));

    const recentAlerts = filteredAlerts
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    const openIncidents = filteredIncidents
      .filter((incident) => incident.status !== 'resolved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats = {
      totalAlertsToday: activeClientId ? filteredAlerts.length : alertsStats.total,
      criticalAlerts: activeClientId
        ? filteredAlerts.filter((alert) => alert.severity === 'critical').length
        : alertsStats.critical,
      openIncidents: openIncidents.length,
      avgMTTR: calculateMttr(filteredIncidents),
      eventsPerSecond: Math.max(0, Math.round(filteredAlerts.length / 86400)),
      clientsMonitored: filteredClients.length,
    };

    return {
      loading,
      error,
      clientsById,
      recentAlerts,
      openIncidents,
      alertTrendData,
      sourceDistribution,
      clientAlertCounts,
      stats,
    };
  }, [alerts, alertsStats, clients, error, incidents, loading, selectedClient]);
}
