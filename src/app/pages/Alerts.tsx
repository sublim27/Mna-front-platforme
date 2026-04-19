import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Search, X, AlertTriangle, UserCheck2, FileSearch } from 'lucide-react';
import {
  SEVERITY_CONFIG,
  SOURCE_TYPE_CONFIG,
  type Severity,
  type AlertStatus,
  type SourceType,
} from '../config/siem-config';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAlertsData } from '../features/alerts/useAlertsData';
import { authClient } from '../features/auth/auth-client';
import { createSecureRef, toPublicId } from '../lib/public-ids';

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

const SOURCE_OPTIONS: SourceType[] = ['firewall', 'endpoint', 'auth', 'ids', 'waf', 'email', 'cloud'];

function fallbackClient(clientId: string): UiClient {
  const shortName = clientId.replace(/^client-/, '').toUpperCase();
  return {
    id: clientId,
    name: clientId,
    shortName,
    color: '#64748B',
    bgColor: '#F1F5F9',
    initials: shortName.slice(0, 2) || 'NA',
    industry: 'Unknown',
    siemTechnology: 'Unknown SIEM',
  };
}

function getSourceMeta(sourceType: SourceType) {
  return SOURCE_TYPE_CONFIG[sourceType] ?? { label: sourceType, icon: '?' };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function SevBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

const STATUS_STYLE: Record<AlertStatus, { color: string; bg: string; label: string }> = {
  new: { color: '#CB5229', bg: '#FBF0EC', label: 'New' },
  investigating: { color: '#1AABBA', bg: '#E6F7F9', label: 'Investigating' },
  resolved: { color: '#10B981', bg: '#ECFDF5', label: 'Resolved' },
  false_positive: { color: '#64748B', bg: '#F1F5F9', label: 'False Positive' },
};

function StatusBadge({ status }: { status: AlertStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function AlertDetail({
  alert,
  client,
  currentUserLabel,
  actionLoading,
  onClose,
  onAssignToMe,
  onCreateIncident,
  onViewLogs,
  onMarkFalsePositive,
  onEscalate,
  onResolve,
}: {
  alert: BackendAlert;
  client: UiClient;
  currentUserLabel: string;
  actionLoading: boolean;
  onClose: () => void;
  onAssignToMe: () => void;
  onCreateIncident: () => void;
  onViewLogs: () => void;
  onMarkFalsePositive: () => void;
  onEscalate: () => void;
  onResolve: () => void;
}) {
  const src = getSourceMeta(alert.sourceType);

  return (
    <div className="flex flex-col h-full bg-white" style={{ borderLeft: '1px solid #E2E8F0' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <SevBadge severity={alert.severity} />
            <StatusBadge status={alert.status} />
            <span style={{ color: '#CBD5E1', fontSize: 11 }}>{toPublicId('alert', alert.id)}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <h3 style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{alert.title}</h3>
      </div>

      <div
        className="flex items-center gap-3 px-5 py-2.5"
        style={{ backgroundColor: client.bgColor, borderBottom: '1px solid #F1F5F9', borderLeft: `3px solid ${client.color}` }}
      >
        <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold" style={{ width: 28, height: 28, backgroundColor: client.color }}>
          {client.initials}
        </div>
        <div>
          <p style={{ color: client.color, fontSize: 13, fontWeight: 600, margin: 0 }}>{client.name}</p>
          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{client.industry}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Description</p>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>{alert.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Detection Rule', alert.rule],
              ['Source Type', `${src.icon} ${src.label}`],
              ['SIEM Technology', client.siemTechnology],
              ['Source IP', alert.sourceIp || '-'],
              ['Destination IP', alert.destIp || '-'],
              ['Timestamp', new Date(alert.timestamp).toLocaleString('en-GB')],
              ['Assignee', alert.assignee || 'Unassigned'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg p-3 bg-slate-50 border border-slate-100">
                <p style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>{k}</p>
                <p style={{ color: '#334155', fontSize: 12, fontFamily: k === 'Detection Rule' || k.includes('IP') ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</p>
              </div>
            ))}
          </div>

          {alert.mitre && (
            <div className="rounded-lg p-3 bg-slate-50 border border-slate-100">
              <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>MITRE ATTACK</p>
              <span className="px-2 py-1 rounded-md text-xs font-mono font-semibold" style={{ backgroundColor: '#F0BC2C20', color: '#C8980E', border: '1px solid #F0BC2C50' }}>
                {alert.mitre}
              </span>
            </div>
          )}

          <Separator />

          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onViewLogs}>
                <FileSearch size={13} /> View Related Logs
              </Button>
              <Button variant="outline" size="sm" onClick={onCreateIncident} disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create Incident'}
              </Button>
              <Button variant="default" size="sm" onClick={onAssignToMe} disabled={actionLoading}>
                <UserCheck2 size={13} /> Assign to {currentUserLabel}
              </Button>
              <Button variant="outline" size="sm" onClick={onEscalate} disabled={actionLoading}>
                Escalate
              </Button>
              <Button variant="outline" size="sm" onClick={onMarkFalsePositive} disabled={actionLoading}>
                Mark as FP
              </Button>
              <Button variant="gold" size="sm" onClick={onResolve} disabled={actionLoading}>
                Resolve
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Alerts() {
  const { selectedClient } = useOutletContext<{ selectedClient: string }>();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const {
    loading,
    error,
    actionError,
    actionLoadingId,
    alerts,
    clientsById,
    assignToMe,
    setStatus,
    createIncidentFromAlert,
  } = useAlertsData(selectedClient);

  const currentUserName = session?.user?.name?.trim() || session?.user?.email?.trim() || 'SOC Analyst';
  const currentUserEmail = session?.user?.email?.trim() || '';

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | SourceType>('all');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!actionError) return;
    setActionNotice({ type: 'error', message: actionError });
  }, [actionError]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeoutId = window.setTimeout(() => setActionNotice(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [actionNotice]);

  const isAssignedToMe = (alert: BackendAlert) => {
    const assignee = normalize(alert.assignee ?? '');
    if (!assignee) return false;
    const meName = normalize(currentUserName);
    const meEmail = normalize(currentUserEmail);
    const meHandle = meEmail ? meEmail.split('@')[0] : '';
    return assignee === meName || assignee === meEmail || (meHandle !== '' && assignee === meHandle);
  };

  const filtered = useMemo(
    () => alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && a.sourceType !== sourceFilter) return false;
      if (assignedToMeOnly && !isAssignedToMe(a)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.sourceIp ?? '').toLowerCase().includes(q) ||
          a.rule.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.assignee ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    }),
    [alerts, assignedToMeOnly, currentUserEmail, currentUserName, search, severityFilter, sourceFilter, statusFilter],
  );

  const selectedAlert = useMemo(
    () => (selectedAlertId ? alerts.find((alert) => alert.id === selectedAlertId) ?? null : null),
    [alerts, selectedAlertId],
  );

  const myQueueCount = useMemo(
    () => alerts.filter((a) => isAssignedToMe(a) && a.status !== 'resolved' && a.status !== 'false_positive').length,
    [alerts, currentUserEmail, currentUserName],
  );

  const counts = useMemo(
    () => ({
      critical: filtered.filter((a) => a.severity === 'critical').length,
      high: filtered.filter((a) => a.severity === 'high').length,
      medium: filtered.filter((a) => a.severity === 'medium').length,
      low: filtered.filter((a) => a.severity === 'low').length,
    }),
    [filtered],
  );

  const sevButtons = [
    { key: 'critical', label: 'Critical', count: counts.critical, color: '#CB5229', activeBg: '#F5DDD6' },
    { key: 'high', label: 'High', count: counts.high, color: '#C8980E', activeBg: '#FAE9A0' },
    { key: 'medium', label: 'Medium', count: counts.medium, color: '#1AABBA', activeBg: '#B8E8EE' },
    { key: 'low', label: 'Low', count: counts.low, color: '#64748B', activeBg: '#E2E8F0' },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle size={30} className="text-red-400" />
        <p style={{ color: '#64748B', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex relative page-shell-immersive" style={{ height: 'calc(100vh - 60px)' }}>
      {selectedAlert && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSelectedAlertId(null)} />}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <div className="bg-white px-4 md:px-6 py-4 space-y-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0 }}>Alert Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FBF0EC', color: '#CB5229' }}>
              {filtered.length} alerts
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}>
              My Queue: {myQueueCount}
            </span>

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts, IPs..." className="pl-8 h-8 w-40 md:w-56 text-xs" />
              </div>
              <Button
                variant={assignedToMeOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignedToMeOnly((value) => !value)}
              >
                Assigned to me
              </Button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | AlertStatus)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30 hidden sm:block"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | SourceType)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30 hidden sm:block"
              >
                <option value="all">All Sources</option>
                {SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>{SOURCE_TYPE_CONFIG[source].label}</option>
                ))}
              </select>
            </div>
          </div>

          {actionNotice && (
            <div
              className="px-3 py-2 rounded-lg text-sm"
              style={actionNotice.type === 'success'
                ? { backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }
                : { backgroundColor: '#FBF0EC', border: '1px solid #F5C5B0' }}
            >
              <span
                style={actionNotice.type === 'success'
                  ? { color: '#0F766E' }
                  : { color: '#CB5229' }}
              >
                {actionNotice.message}
              </span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSeverityFilter('all')}
              className="px-3 h-8 rounded-lg text-xs font-medium border transition-all"
              style={{
                backgroundColor: severityFilter === 'all' ? '#E6F7F9' : '#FFFFFF',
                color: severityFilter === 'all' ? '#1AABBA' : '#64748B',
                borderColor: severityFilter === 'all' ? '#1AABBA' : '#E2E8F0',
              }}
            >
              All ({filtered.length})
            </button>

            {sevButtons.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeverityFilter(severityFilter === s.key ? 'all' : s.key)}
                className="flex items-center gap-2 px-4 h-8 rounded-lg border transition-all"
                style={{
                  backgroundColor: severityFilter === s.key ? s.activeBg : '#FFFFFF',
                  borderColor: severityFilter === s.key ? s.color : '#E2E8F0',
                  color: s.color,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{s.count}</span>
                <span style={{ fontSize: 11 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                <TableHead style={{ width: 6 }}></TableHead>
                <TableHead>Alert</TableHead>
                <TableHead style={{ width: 90 }}>Severity</TableHead>
                <TableHead style={{ width: 110 }} className="hidden sm:table-cell">Client</TableHead>
                <TableHead style={{ width: 120 }} className="hidden md:table-cell">Source</TableHead>
                <TableHead style={{ width: 120 }} className="hidden sm:table-cell">Status</TableHead>
                <TableHead style={{ width: 70 }} className="hidden md:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <AlertTriangle size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 text-sm">No alerts match the current filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((alert) => {
                  const client = clientsById[alert.clientId] ?? fallbackClient(alert.clientId);
                  const sourceMeta = getSourceMeta(alert.sourceType);
                  const isSelected = selectedAlertId === alert.id;

                  return (
                    <TableRow
                      key={alert.id}
                      onClick={() => setSelectedAlertId(isSelected ? null : alert.id)}
                      data-state={isSelected ? 'selected' : undefined}
                      style={{ borderLeft: `3px solid ${client.color}` }}
                    >
                      <TableCell style={{ padding: 0, width: 3 }}></TableCell>
                      <TableCell>
                        <p style={{ color: '#334155', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{alert.title}</p>
                        <p style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>
                          {toPublicId('alert', alert.id)} - {alert.sourceIp || '-'}
                          {alert.assignee && <span style={{ color: '#1AABBA', marginLeft: 8 }}>@{alert.assignee}</span>}
                          {alert.mitre && <span style={{ color: '#F0BC2C', marginLeft: 8 }}>{alert.mitre}</span>}
                        </p>
                      </TableCell>
                      <TableCell><SevBadge severity={alert.severity} /></TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                          <span style={{ color: client.color, fontSize: 12, fontWeight: 500 }}>{client.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span style={{ color: '#64748B', fontSize: 11 }}>{sourceMeta.icon} {sourceMeta.label}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><StatusBadge status={alert.status} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span style={{ color: '#94A3B8', fontSize: 11 }}>
                          {new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedAlert && (
        <div className={[
          'fixed inset-y-[60px] right-0 z-30 w-full sm:w-[420px]',
          'lg:static lg:w-[420px] lg:shrink-0 lg:h-full',
        ].join(' ')}>
          <AlertDetail
            alert={selectedAlert}
            client={clientsById[selectedAlert.clientId] ?? fallbackClient(selectedAlert.clientId)}
            currentUserLabel={currentUserName}
            actionLoading={actionLoadingId === selectedAlert.id}
            onClose={() => setSelectedAlertId(null)}
            onAssignToMe={() => {
              void assignToMe(selectedAlert, currentUserName);
            }}
            onCreateIncident={() => {
              void (async () => {
                try {
                  await createIncidentFromAlert(selectedAlert, currentUserName);
                  setActionNotice({
                    type: 'success',
                    message: 'Incident created. Notification email has been triggered for users.',
                  });
                } catch {
                  // Error message is handled via actionError -> actionNotice effect.
                }
              })();
            }}
            onViewLogs={() => {
              const alertRef = createSecureRef('alert', selectedAlert.id);
              navigate(`/logs?alertRef=${encodeURIComponent(alertRef)}`);
            }}
            onMarkFalsePositive={() => {
              void setStatus(selectedAlert, 'false_positive');
            }}
            onEscalate={() => {
              void setStatus(selectedAlert, 'investigating');
            }}
            onResolve={() => {
              void setStatus(selectedAlert, 'resolved');
            }}
          />
        </div>
      )}
    </div>
  );
}
