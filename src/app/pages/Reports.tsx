import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight,
  BarChart3,
  Siren,
  ShieldAlert,
  FileCheck2,
  Building2,
  ScanSearch,
  type LucideIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { SEVERITY_CONFIG, type AlertStatus, type Severity } from '../config/siem-config';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PageHero, PageShell } from '../components/layout/page-shell';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { useClientDirectory } from '../features/client/use-client-directory';
import { toPublicId } from '../lib/public-ids';

type BackendAlert = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  clientId: string;
  sourceType: string;
  timestamp: string;
  rule: string;
};

type BackendIncident = {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type AlertsListResponse = {
  data: BackendAlert[];
};

const REPORT_TEMPLATES = [
  { id: 'exec-summary', name: 'Executive Summary', desc: 'High-level posture from active alerts and incidents', icon: BarChart3, freq: 'On Demand', color: '#1AABBA' },
  { id: 'incident-report', name: 'Incident Report', desc: 'Incident backlog and response status timeline', icon: Siren, freq: 'On Demand', color: '#CB5229' },
  { id: 'threat-digest', name: 'Threat Intel Digest', desc: 'Top indicators and source distribution from alerts', icon: ShieldAlert, freq: 'On Demand', color: '#F0BC2C' },
  { id: 'soc2-compliance', name: 'SOC 2 Compliance Snapshot', desc: 'Alert evidence for control monitoring review', icon: FileCheck2, freq: 'On Demand', color: '#10B981' },
  { id: 'client-monthly', name: 'Client Monthly Review', desc: 'Client-by-client open alert burden and severity mix', icon: Building2, freq: 'On Demand', color: '#2563EB' },
  { id: 'vuln-assessment', name: 'Exposure Assessment', desc: 'High severity detections requiring patch/containment', icon: ScanSearch, freq: 'On Demand', color: '#8B5CF6' },
] as const;

const STATUS_STYLE: Record<AlertStatus, { color: string; bg: string; label: string }> = {
  new: { color: '#CB5229', bg: '#FBF0EC', label: 'New' },
  investigating: { color: '#1AABBA', bg: '#E6F7F9', label: 'Investigating' },
  resolved: { color: '#10B981', bg: '#ECFDF5', label: 'Resolved' },
  false_positive: { color: '#64748B', bg: '#F1F5F9', label: 'False Positive' },
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

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SevBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const cfg = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function getRangeStart(dateRange: string) {
  const now = Date.now();
  if (dateRange === 'last-24h') return now - 24 * 60 * 60 * 1000;
  if (dateRange === 'last-7') return now - 7 * 24 * 60 * 60 * 1000;
  if (dateRange === 'last-30') return now - 30 * 24 * 60 * 60 * 1000;
  if (dateRange === 'last-90') return now - 90 * 24 * 60 * 60 * 1000;
  return 0;
}

export default function Reports() {
  const { clients, clientsById } = useClientDirectory();
  const [showModal, setShowModal] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [dateRange, setDateRange] = useState<'last-24h' | 'last-7' | 'last-30' | 'last-90'>('last-7');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [incidents, setIncidents] = useState<BackendIncident[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [alertsRes, incidentsRes] = await Promise.allSettled([
          apiFetch<AlertsListResponse>('/api/alerts?limit=500&page=1&order=desc'),
          apiFetch<BackendIncident[]>('/api/incidents'),
        ]);

        if (!active) return;

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data ?? []);
        } else {
          throw alertsRes.reason;
        }

        if (incidentsRes.status === 'fulfilled') {
          setIncidents(incidentsRes.value ?? []);
        } else {
          setIncidents([]);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load report data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const rangeStart = useMemo(() => getRangeStart(dateRange), [dateRange]);

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => {
      if (selectedClient !== 'all' && alert.clientId !== selectedClient) return false;
      return new Date(alert.timestamp).getTime() >= rangeStart;
    }),
    [alerts, rangeStart, selectedClient],
  );

  const filteredIncidents = useMemo(
    () => incidents.filter((incident) => new Date(incident.createdAt).getTime() >= rangeStart),
    [incidents, rangeStart],
  );

  const criticalAlerts = filteredAlerts.filter((alert) => alert.severity === 'critical').length;
  const coveredClients = new Set(filteredAlerts.map((alert) => alert.clientId)).size;
  const activeIncidents = filteredIncidents.filter((incident) => incident.status !== 'resolved').length;
  const readyExports = filteredAlerts.length;

  const metrics = [
    { label: 'Alerts In Range', value: filteredAlerts.length.toLocaleString(), icon: FileText, color: '#1AABBA' },
    { label: 'Critical Alerts', value: criticalAlerts.toLocaleString(), icon: AlertTriangle, color: '#CB5229' },
    { label: 'Active Incidents', value: activeIncidents.toLocaleString(), icon: Clock, color: '#F0BC2C' },
    { label: 'Clients Covered', value: coveredClients.toLocaleString(), icon: Calendar, color: '#10B981' },
  ];

  const rows = filteredAlerts.slice(0, 12);

  const handleGenerate = () => {
    const tpl = REPORT_TEMPLATES.find((template) => template.id === selectedTpl);
    const payload = {
      generatedAt: new Date().toISOString(),
      template: tpl?.name ?? 'Ad-hoc Snapshot',
      scope: {
        client: selectedClient,
        dateRange,
      },
      summary: {
        alerts: filteredAlerts.length,
        criticalAlerts,
        incidents: filteredIncidents.length,
        activeIncidents,
      },
      alerts: filteredAlerts.slice(0, 100),
      incidents: filteredIncidents.slice(0, 100),
    };

    const safeTemplate = (tpl?.id ?? 'snapshot').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    downloadJson(`report-${safeTemplate}-${Date.now()}.json`, payload);
    setShowModal(false);
  };

  return (
    <PageShell className="max-w-7xl">
      <PageHero
        title="Reports"
        subtitle="Generate exports from live backend alerts and incident data."
        actions={(
          <Button onClick={() => setShowModal(true)}>
            <Plus size={14} /> Generate Report
          </Button>
        )}
      />

      {error && (
        <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#FBF0EC', border: '1px solid #F5C5B0', color: '#CB5229' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-xl"
                        style={{ width: 42, height: 42, backgroundColor: `${metric.color}18`, border: `1px solid ${metric.color}35` }}
                      >
                        <Icon size={18} style={{ color: metric.color }} />
                      </div>
                      <div>
                        <p style={{ color: '#0F172A', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{metric.value}</p>
                        <p style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>{metric.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div>
            <h2 style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Report Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon as LucideIcon;
                return (
                  <Card
                    key={tpl.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
                    onClick={() => { setSelectedTpl(tpl.id); setShowModal(true); }}
                    style={{ borderLeft: `3px solid ${tpl.color}` }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="flex items-center justify-center rounded-xl shrink-0"
                          style={{ width: 38, height: 38, backgroundColor: `${tpl.color}16`, border: `1px solid ${tpl.color}35` }}
                        >
                          <Icon size={18} style={{ color: tpl.color }} />
                        </div>
                        <div>
                          <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, margin: 0 }}>{tpl.name}</p>
                          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{tpl.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${tpl.color}18`, color: tpl.color }}>
                          {tpl.freq}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#1AABBA' }}>
                          Generate <ChevronRight size={12} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <h2 style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Latest Backend Events</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: 110 }}>Alert</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead style={{ width: 120 }}>Client</TableHead>
                    <TableHead style={{ width: 100 }}>Severity</TableHead>
                    <TableHead style={{ width: 120 }}>Status</TableHead>
                    <TableHead style={{ width: 90 }}>Age</TableHead>
                    <TableHead style={{ width: 84 }}>Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center" style={{ color: '#94A3B8' }}>
                        No backend alerts found for this range.
                      </TableCell>
                    </TableRow>
                  ) : rows.map((alert) => {
                    const client = clientsById[alert.clientId];
                    return (
                      <TableRow key={alert.id}>
                        <TableCell style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: 11 }}>{toPublicId('alert', alert.id)}</TableCell>
                        <TableCell>
                          <p style={{ color: '#334155', fontSize: 12, fontWeight: 500, margin: 0 }}>{alert.title}</p>
                          <p style={{ color: '#CBD5E1', fontSize: 10, margin: 0 }}>{alert.rule}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.color ?? '#94A3B8' }} />
                            <span style={{ color: '#64748B', fontSize: 12 }}>{client?.shortName ?? alert.clientId}</span>
                          </div>
                        </TableCell>
                        <TableCell><SevBadge severity={alert.severity} /></TableCell>
                        <TableCell><StatusBadge status={alert.status} /></TableCell>
                        <TableCell style={{ color: '#94A3B8', fontSize: 11 }}>{timeSince(alert.timestamp)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: '#1AABBA' }}
                            onClick={() => downloadJson(`alert-${alert.id}.json`, alert)}
                          >
                            <Download size={13} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>Create an export from live backend data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Report Template
              </label>
              <select
                value={selectedTpl}
                onChange={(e) => setSelectedTpl(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="">Select template...</option>
                {REPORT_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Client Scope
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="all">All Clients</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'last-24h' | 'last-7' | 'last-30' | 'last-90')}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="last-24h">Last 24 hours</option>
                <option value="last-7">Last 7 days</option>
                <option value="last-30">Last 30 days</option>
                <option value="last-90">Last 90 days</option>
              </select>
            </div>
            <Separator />
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              Ready exports for current scope: {readyExports}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleGenerate}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
