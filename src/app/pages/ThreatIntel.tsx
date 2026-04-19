import { useEffect, useMemo, useState } from 'react';
import { Globe, Hash, Link, Search, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { SEVERITY_CONFIG, type Severity, type SourceType, SOURCE_TYPE_CONFIG, SOURCE_TYPES } from '../config/siem-config';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PageHero, PageShell } from '../components/layout/page-shell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { useClientDirectory } from '../features/client/use-client-directory';

type BackendAlert = {
  id: string;
  title: string;
  severity: Severity;
  sourceType: SourceType;
  sourceIp: string | null;
  destIp: string | null;
  timestamp: string;
  rule: string;
  clientId: string;
  mitre: string | null;
};

type AlertsListResponse = {
  data: BackendAlert[];
};

type IOCType = 'ip' | 'domain' | 'hash' | 'url';

type DerivedIOC = {
  id: string;
  type: IOCType;
  value: string;
  threat: string;
  confidence: number;
  lastSeen: string;
  source: string;
  tags: string[];
  sightings: number;
};

type MitreRow = {
  id: string;
  sightings: number;
  lastSeen: string;
  highestSeverity: Severity;
  clients: number;
};

const SOURCE_COLORS: Record<SourceType, string> = {
  firewall: '#1AABBA',
  endpoint: '#CB5229',
  auth: '#F0BC2C',
  ids: '#2563EB',
  waf: '#E07820',
  email: '#10B981',
  cloud: '#8B5CF6',
};

const IOC_ICONS: Record<IOCType, typeof Globe> = {
  ip: Globe,
  domain: Link,
  hash: Hash,
  url: Link,
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

function severityWeight(severity: Severity) {
  if (severity === 'critical') return 5;
  if (severity === 'high') return 4;
  if (severity === 'medium') return 3;
  if (severity === 'low') return 2;
  return 1;
}

function isIp(value: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

function isDomain(value: string) {
  return /[a-z]/i.test(value) && value.includes('.') && !value.includes(' ');
}

function normalizeIndicator(value: string) {
  return value.trim().toLowerCase();
}

function deriveIocs(alerts: BackendAlert[]): DerivedIOC[] {
  const map = new Map<string, {
    value: string;
    type: IOCType;
    sightings: number;
    lastSeen: string;
    highestWeight: number;
    sourceType: SourceType;
    threat: string;
    tags: Set<string>;
  }>();

  alerts.forEach((alert) => {
    const indicators = [alert.sourceIp, alert.destIp].filter((value): value is string => !!value && value !== '-');
    indicators.forEach((raw) => {
      const value = normalizeIndicator(raw);
      let type: IOCType | null = null;
      if (isIp(value)) type = 'ip';
      else if (isDomain(value)) type = 'domain';
      if (!type) return;

      const key = `${type}:${value}`;
      const existing = map.get(key);
      const weight = severityWeight(alert.severity);
      const tags = new Set([alert.sourceType, alert.severity]);
      if (alert.mitre) tags.add(alert.mitre);

      if (!existing) {
        map.set(key, {
          value,
          type,
          sightings: 1,
          lastSeen: alert.timestamp,
          highestWeight: weight,
          sourceType: alert.sourceType,
          threat: alert.title || alert.rule,
          tags,
        });
        return;
      }

      existing.sightings += 1;
      if (new Date(alert.timestamp).getTime() > new Date(existing.lastSeen).getTime()) {
        existing.lastSeen = alert.timestamp;
      }
      if (weight > existing.highestWeight) {
        existing.highestWeight = weight;
        existing.threat = alert.title || alert.rule;
      }
      tags.forEach((tag) => existing.tags.add(tag));
    });
  });

  return Array.from(map.entries())
    .map(([key, row]) => ({
      id: key,
      type: row.type,
      value: row.value,
      threat: row.threat,
      confidence: Math.min(99, 50 + row.sightings * 7 + row.highestWeight * 6),
      lastSeen: row.lastSeen,
      source: SOURCE_TYPE_CONFIG[row.sourceType].label,
      tags: Array.from(row.tags).slice(0, 4),
      sightings: row.sightings,
    }))
    .sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
}

function deriveMitre(alerts: BackendAlert[]): MitreRow[] {
  const map = new Map<string, {
    sightings: number;
    lastSeen: string;
    highestSeverity: Severity;
    clients: Set<string>;
  }>();

  alerts.forEach((alert) => {
    if (!alert.mitre) return;
    const key = alert.mitre;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        sightings: 1,
        lastSeen: alert.timestamp,
        highestSeverity: alert.severity,
        clients: new Set([alert.clientId]),
      });
      return;
    }

    existing.sightings += 1;
    existing.clients.add(alert.clientId);
    if (new Date(alert.timestamp).getTime() > new Date(existing.lastSeen).getTime()) {
      existing.lastSeen = alert.timestamp;
    }
    if (severityWeight(alert.severity) > severityWeight(existing.highestSeverity)) {
      existing.highestSeverity = alert.severity;
    }
  });

  return Array.from(map.entries())
    .map(([id, row]) => ({
      id,
      sightings: row.sightings,
      lastSeen: row.lastSeen,
      highestSeverity: row.highestSeverity,
      clients: row.clients.size,
    }))
    .sort((a, b) => b.sightings - a.sightings);
}

function formatSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

export default function ThreatIntel() {
  const { clientsById } = useClientDirectory();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc');
        if (!active) return;
        setAlerts(response.data ?? []);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load threat intel data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const iocs = useMemo(() => deriveIocs(alerts), [alerts]);
  const mitre = useMemo(() => deriveMitre(alerts), [alerts]);

  const sourceCounts = useMemo(
    () => SOURCE_TYPES.map((source) => {
      const count = alerts.filter((alert) => alert.sourceType === source).length;
      return {
        source,
        label: SOURCE_TYPE_CONFIG[source].label,
        count,
        color: SOURCE_COLORS[source],
      };
    }).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count),
    [alerts],
  );

  const filteredIocs = useMemo(
    () => iocs.filter((ioc) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return ioc.value.includes(q) || ioc.threat.toLowerCase().includes(q) || ioc.tags.join(' ').toLowerCase().includes(q);
    }),
    [iocs, search],
  );

  return (
    <PageShell className="max-w-7xl">
      <PageHero
        title="Threat Intelligence"
        subtitle={`${iocs.length} indicators derived from backend alert telemetry.`}
      />

      {error && (
        <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#FBF0EC', color: '#CB5229', border: '1px solid #F5C5B0' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="ioc">
          <TabsList>
            <TabsTrigger value="ioc">IOC Feed <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-teal-light text-teal">{iocs.length}</span></TabsTrigger>
            <TabsTrigger value="mitre">MITRE Watch <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gold-light text-gold-dark">{mitre.length}</span></TabsTrigger>
            <TabsTrigger value="sources">Telemetry Sources <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200 text-slate-600">{sourceCounts.length}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="ioc">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle>Derived Indicators of Compromise</CardTitle>
                  <div className="ml-auto relative w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search indicators..." className="pl-8 h-8 text-xs" />
                  </div>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Indicator</TableHead>
                    <TableHead>Threat Context</TableHead>
                    <TableHead style={{ width: 90 }}>Sightings</TableHead>
                    <TableHead style={{ width: 90 }}>Confidence</TableHead>
                    <TableHead style={{ width: 130 }}>Last Seen</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center" style={{ color: '#94A3B8' }}>
                        No indicators match this search.
                      </TableCell>
                    </TableRow>
                  ) : filteredIocs.map((ioc) => {
                    const Icon = IOC_ICONS[ioc.type];
                    return (
                      <TableRow key={ioc.id}>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}>
                            <Icon size={10} />{ioc.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: '#1AABBA', fontFamily: 'monospace', fontSize: 12 }}>{ioc.value}</span>
                        </TableCell>
                        <TableCell style={{ color: '#475569', fontSize: 12 }}>
                          {ioc.threat}
                        </TableCell>
                        <TableCell style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>
                          {ioc.sightings}
                        </TableCell>
                        <TableCell style={{ color: ioc.confidence >= 90 ? '#CB5229' : ioc.confidence >= 70 ? '#C8980E' : '#1AABBA', fontSize: 12, fontWeight: 700 }}>
                          {ioc.confidence}%
                        </TableCell>
                        <TableCell style={{ color: '#94A3B8', fontSize: 11 }}>
                          {formatSince(ioc.lastSeen)}
                        </TableCell>
                        <TableCell style={{ color: '#64748B', fontSize: 12 }}>{ioc.source}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="mitre">
            <div className="space-y-3">
              {mitre.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle size={28} className="mx-auto mb-3 text-slate-300" />
                    <p style={{ color: '#94A3B8', fontSize: 13 }}>No MITRE mappings in current alerts.</p>
                  </CardContent>
                </Card>
              ) : mitre.slice(0, 20).map((item) => {
                const sev = SEVERITY_CONFIG[item.highestSeverity];
                return (
                  <Card key={item.id} style={{ borderLeft: `4px solid ${sev.color}` }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: 0 }}>{item.id}</p>
                          <p style={{ color: '#64748B', fontSize: 12, margin: 0 }}>
                            {item.sightings} sightings across {item.clients} client{item.clients !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                          >
                            {sev.label}
                          </span>
                          <p style={{ color: '#94A3B8', fontSize: 11, margin: '4px 0 0' }}>{formatSince(item.lastSeen)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead style={{ width: 130 }}>Alerts</TableHead>
                    <TableHead>Top Clients</TableHead>
                    <TableHead style={{ width: 100 }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceCounts.map((source) => {
                    const topClients = alerts
                      .filter((alert) => alert.sourceType === source.source)
                      .reduce<Record<string, number>>((acc, alert) => {
                        acc[alert.clientId] = (acc[alert.clientId] ?? 0) + 1;
                        return acc;
                      }, {});

                    const labels = Object.entries(topClients)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([clientId]) => clientsById[clientId]?.shortName ?? clientId);

                    return (
                      <TableRow key={source.source}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                            <span style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>{source.label}</span>
                          </div>
                        </TableCell>
                        <TableCell style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>{source.count.toLocaleString()}</TableCell>
                        <TableCell style={{ color: '#64748B', fontSize: 12 }}>
                          {labels.length > 0 ? labels.join(', ') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#10B981' }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#10B981' }} />
                            </span>
                            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 500 }}>Active</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
