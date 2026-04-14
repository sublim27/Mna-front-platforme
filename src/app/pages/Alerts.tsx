import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { Search, X, AlertTriangle, ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  ALERTS, CLIENTS, SEVERITY_CONFIG, SOURCE_TYPE_CONFIG,
  type Alert, type Severity, type AlertStatus,
} from '../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';

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
  new:            { color: '#CB5229', bg: '#FBF0EC', label: 'New' },
  investigating:  { color: '#1AABBA', bg: '#E6F7F9', label: 'Investigating' },
  resolved:       { color: '#10B981', bg: '#ECFDF5', label: 'Resolved' },
  false_positive: { color: '#64748B', bg: '#F1F5F9', label: 'False Positive' },
};

function StatusBadge({ status }: { status: AlertStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function AlertDetail({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const client = CLIENTS[alert.clientId];
  const sev = SEVERITY_CONFIG[alert.severity];
  const src = SOURCE_TYPE_CONFIG[alert.sourceType];

  const actions = ['Create Incident', 'Assign to Me', 'Mark as FP', 'Escalate', 'Resolve'];

  return (
    <div className="flex flex-col h-full bg-white" style={{ borderLeft: '1px solid #E2E8F0' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <SevBadge severity={alert.severity} />
            <StatusBadge status={alert.status} />
            <span style={{ color: '#CBD5E1', fontSize: 11 }}>{alert.id}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <h3 style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{alert.title}</h3>
      </div>

      {/* Client strip */}
      <div
        className="flex items-center gap-3 px-5 py-2.5"
        style={{ backgroundColor: client.bgColor, borderBottom: '1px solid #F1F5F9', borderLeft: `3px solid ${client.color}` }}
      >
        <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold"
          style={{ width: 28, height: 28, backgroundColor: client.color }}>
          {client.initials}
        </div>
        <div>
          <p style={{ color: client.color, fontSize: 13, fontWeight: 600, margin: 0 }}>{client.name}</p>
          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{client.industry}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Description */}
          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Description</p>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>{alert.description}</p>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Detection Rule', alert.rule],
              ['Source Type',    `${src.icon} ${src.label}`],
              ['Source IP',      alert.sourceIp || '—'],
              ['Destination IP', alert.destIp   || '—'],
              ['Timestamp',      new Date(alert.timestamp).toLocaleString('en-GB')],
              ['Assignee',       alert.assignee || 'Unassigned'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg p-3 bg-slate-50 border border-slate-100">
                <p style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>{k}</p>
                <p style={{ color: '#334155', fontSize: 12, fontFamily: k === 'Detection Rule' || k?.includes('IP') ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</p>
              </div>
            ))}
          </div>

          {/* MITRE */}
          {alert.mitre && (
            <div className="rounded-lg p-3 bg-slate-50 border border-slate-100">
              <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>MITRE ATT&CK</p>
              <span className="px-2 py-1 rounded-md text-xs font-mono font-semibold"
                style={{ backgroundColor: '#F0BC2C20', color: '#C8980E', border: '1px solid #F0BC2C50' }}>
                {alert.mitre}
              </span>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {actions.map(a => (
                <Button key={a} variant={a === 'Create Incident' ? 'default' : a === 'Resolve' ? 'gold' : 'outline'} size="sm">
                  {a}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Alerts() {
  const { selectedClient } = useOutletContext<{ selectedClient: string }>();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filtered = useMemo(() => ALERTS.filter(a => {
    if (selectedClient !== 'all' && a.clientId !== selectedClient) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter  !== 'all' && a.status   !== statusFilter)   return false;
    if (sourceFilter  !== 'all' && a.sourceType !== sourceFilter)  return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.sourceIp.includes(q) || a.rule.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    }
    return true;
  }), [selectedClient, severityFilter, statusFilter, sourceFilter, search]);

  const counts = useMemo(() => ({
    critical: filtered.filter(a => a.severity === 'critical').length,
    high:     filtered.filter(a => a.severity === 'high').length,
    medium:   filtered.filter(a => a.severity === 'medium').length,
    low:      filtered.filter(a => a.severity === 'low').length,
  }), [filtered]);

  const sevButtons = [
    { key: 'critical', label: 'Critical', count: counts.critical, color: '#CB5229', bg: '#FBF0EC', activeBg: '#F5DDD6' },
    { key: 'high',     label: 'High',     count: counts.high,     color: '#C8980E', bg: '#FEF7E0', activeBg: '#FAE9A0' },
    { key: 'medium',   label: 'Medium',   count: counts.medium,   color: '#1AABBA', bg: '#E6F7F9', activeBg: '#B8E8EE' },
    { key: 'low',      label: 'Low',      count: counts.low,      color: '#64748B', bg: '#F1F5F9', activeBg: '#E2E8F0' },
  ];

  return (
    <div className="flex relative" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Mobile detail overlay backdrop */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSelectedAlert(null)}
        />
      )}

      {/* Main Panel */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="bg-white px-4 md:px-6 py-4 space-y-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0 }}>Alert Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#FBF0EC', color: '#CB5229' }}>
              {filtered.length} alerts
            </span>
            {/* Filters row right */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts, IPs…" className="pl-8 h-8 w-40 md:w-56 text-xs" />
              </div>
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30 hidden sm:block"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
              <select
                value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30 hidden sm:block"
              >
                <option value="all">All Sources</option>
                {['firewall','endpoint','auth','ids','waf','email','cloud'].map(s => (
                  <option key={s} value={s}>{SOURCE_TYPE_CONFIG[s as any].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity pills */}
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
            {sevButtons.map(s => (
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

        {/* Table */}
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
              ) : filtered.map(alert => {
                const client = CLIENTS[alert.clientId];
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <TableRow
                    key={alert.id}
                    onClick={() => setSelectedAlert(isSelected ? null : alert)}
                    data-state={isSelected ? 'selected' : undefined}
                    style={{ borderLeft: `3px solid ${client.color}` }}
                  >
                    <TableCell style={{ padding: 0, width: 3 }}></TableCell>
                    <TableCell>
                      <p style={{ color: '#334155', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{alert.title}</p>
                      <p style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>
                        {alert.id} · {alert.sourceIp}
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
                      <span style={{ color: '#64748B', fontSize: 11 }}>
                        {SOURCE_TYPE_CONFIG[alert.sourceType].icon} {SOURCE_TYPE_CONFIG[alert.sourceType].label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><StatusBadge status={alert.status} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span style={{ color: '#94A3B8', fontSize: 11 }}>
                        {new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Panel — sidebar on desktop, overlay on mobile */}
      {selectedAlert && (
        <div
          className={[
            // Mobile: fixed overlay, centered
            'fixed inset-y-[60px] right-0 z-30 w-full sm:w-[420px]',
            // Desktop: static panel
            'lg:static lg:w-[420px] lg:shrink-0 lg:h-full',
          ].join(' ')}
        >
          <AlertDetail alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
        </div>
      )}
    </div>
  );
}