import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import type { AlertStatus, Severity, SourceType } from '../../config/siem-config';

type BackendAlert = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  sourceType: SourceType;
  sourceIp: string | null;
  destIp: string | null;
  timestamp: string;
  clientId: string;
  agentName: string;
};

type BackendAlertDetail = BackendAlert;

type AlertsListResponse = {
  data: BackendAlert[];
};

type CorrelationType = 'trigger' | 'context' | 'related';

type BackendCorrelatedLog = {
  id: string;
  timestamp: string;
  correlationType: CorrelationType;
  agentName: string;
  agentIp: string;
  ruleDescription: string;
  data: Record<string, unknown>;
  fullLog: string;
};

type CorrelatedLogsResponse = {
  alertId: string;
  totalLogs: number;
  timeline: BackendCorrelatedLog[];
};

type BackendClient = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  siemTechnology?: string;
};

export type LogViewEntry = {
  id: string;
  timestamp: string;
  clientId: string;
  sourceType: SourceType;
  severity: Severity;
  message: string;
  sourceIp: string;
  destIp: string;
  username: string;
  host: string;
  eventId: string;
  correlationType?: CorrelationType;
  ruleDescription?: string;
};

export type LogViewClient = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
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

function pickText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function pickFromData(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function mapAlertAsLog(alert: BackendAlert): LogViewEntry {
  return {
    id: alert.id,
    timestamp: alert.timestamp,
    clientId: alert.clientId,
    sourceType: alert.sourceType,
    severity: alert.severity,
    message: alert.description || alert.title,
    sourceIp: alert.sourceIp ?? '-',
    destIp: alert.destIp ?? '-',
    username: '',
    host: alert.agentName || 'unknown-host',
    eventId: alert.id,
  };
}

function mapCorrelatedLog(
  log: BackendCorrelatedLog,
  alert: BackendAlertDetail,
): LogViewEntry {
  const data = log.data && typeof log.data === 'object'
    ? log.data
    : {};

  const sourceIp = pickText(
    pickFromData(data, ['srcip', 'src_ip', 'source_ip', 'sourceIp']),
    alert.sourceIp,
    log.agentIp,
    '-',
  );

  const destIp = pickText(
    pickFromData(data, ['dstip', 'dst_ip', 'destination_ip', 'destIp']),
    alert.destIp,
    '-',
  );

  const username = pickText(
    pickFromData(data, ['user', 'username', 'dstuser', 'srcuser']),
    '',
  );

  return {
    id: log.id,
    timestamp: log.timestamp,
    clientId: alert.clientId,
    sourceType: alert.sourceType,
    severity: alert.severity,
    message: pickText(log.fullLog, log.ruleDescription, alert.description, alert.title),
    sourceIp,
    destIp,
    username,
    host: pickText(log.agentName, alert.agentName, 'unknown-host'),
    eventId: alert.id,
    correlationType: log.correlationType,
    ruleDescription: log.ruleDescription,
  };
}

export function useLogsData(selectedClient: string, alertIdFilter?: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<LogViewEntry[]>([]);
  const [clientsById, setClientsById] = useState<Record<string, LogViewClient>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [logsRes, clientsRes] = await Promise.allSettled([
          alertIdFilter
            ? Promise.all([
                apiFetch<CorrelatedLogsResponse>(`/api/logs/${encodeURIComponent(alertIdFilter)}`),
                apiFetch<BackendAlertDetail>(`/api/alerts/${encodeURIComponent(alertIdFilter)}`),
              ])
            : apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc'),
          apiFetch<BackendClient[]>('/api/clients'),
        ]);

        if (!active) return;

        if (logsRes.status === 'fulfilled') {
          const mappedLogs = alertIdFilter
            ? logsRes.value[0].timeline.map((entry) => mapCorrelatedLog(entry, logsRes.value[1]))
            : (logsRes.value.data ?? []).map(mapAlertAsLog);
          setLogs(mappedLogs);
        } else {
          throw logsRes.reason;
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
                siemTechnology: client.siemTechnology ?? 'Unknown SIEM',
              },
            ]),
          ) as Record<string, LogViewClient>;
          setClientsById(mapped);
        } else {
          setClientsById({});
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [alertIdFilter]);

  return useMemo(() => {
    if (alertIdFilter) {
      return {
        loading,
        error,
        logs,
        clientsById,
      };
    }

    const hasSelectedClient =
      selectedClient !== 'all' && logs.some((log) => log.clientId === selectedClient);

    const activeClientId = hasSelectedClient ? selectedClient : null;

    const filteredLogs = activeClientId
      ? logs.filter((log) => log.clientId === activeClientId)
      : logs;

    return {
      loading,
      error,
      logs: filteredLogs,
      clientsById,
    };
  }, [alertIdFilter, clientsById, error, loading, logs, selectedClient]);
}
