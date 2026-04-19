import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { X, Flame, Plus } from 'lucide-react';
import { SEVERITY_CONFIG, type Severity } from '../config/siem-config';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { useIncidentsData } from '../features/incidents/useIncidentsData';
import { toPublicId } from '../lib/public-ids';

type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';

type IncidentView = {
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

type IncidentClient = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
  industry: string;
};

type AlertStub = {
  id: string;
  title: string;
  severity: Severity;
};

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function SevBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

const STATUS_CFG: Record<IncidentStatus, { color: string; bg: string; label: string }> = {
  open: { color: '#CB5229', bg: '#FBF0EC', label: 'Open' },
  investigating: { color: '#1AABBA', bg: '#E6F7F9', label: 'Investigating' },
  contained: { color: '#C8980E', bg: '#FEF7E0', label: 'Contained' },
  resolved: { color: '#10B981', bg: '#ECFDF5', label: 'Resolved' },
};

function StatusBadge({ status }: { status: IncidentStatus }) {
  const s = STATUS_CFG[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function TLPBadge({ tlp }: { tlp: string }) {
  const m: Record<string, string> = { RED: '#CB5229', AMBER: '#C8980E', GREEN: '#10B981', WHITE: '#94A3B8' };
  const c = m[tlp] ?? '#94A3B8';
  return (
    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${c}20`, color: c, border: `1px solid ${c}40` }}>
      TLP:{tlp}
    </span>
  );
}

const COLS: Array<{ key: IncidentStatus; label: string; color: string; bg: string }> = [
  { key: 'open', label: 'Open', color: '#CB5229', bg: '#FBF0EC' },
  { key: 'investigating', label: 'Investigating', color: '#1AABBA', bg: '#E6F7F9' },
  { key: 'contained', label: 'Contained', color: '#C8980E', bg: '#FEF7E0' },
  { key: 'resolved', label: 'Resolved', color: '#10B981', bg: '#ECFDF5' },
];

function IncidentDetail({
  incident,
  client,
  relatedAlerts,
  actionLoading,
  onClose,
  onStatusChange,
}: {
  incident: IncidentView;
  client: IncidentClient;
  relatedAlerts: AlertStub[];
  actionLoading: boolean;
  onClose: () => void;
  onStatusChange: (status: IncidentStatus) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white" style={{ borderLeft: '1px solid #E2E8F0' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <SevBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <TLPBadge tlp={incident.tlp} />
            <span style={{ color: '#CBD5E1', fontSize: 11 }}>{toPublicId('incident', incident.id)}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <h3 style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{incident.title}</h3>
      </div>

      <div className="flex items-center gap-3 px-5 py-2.5" style={{ backgroundColor: client.bgColor, borderBottom: '1px solid #F1F5F9', borderLeft: `3px solid ${client.color}` }}>
        <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold" style={{ width: 28, height: 28, backgroundColor: client.color }}>
          {client.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: client.color, fontSize: 13, fontWeight: 600, margin: 0 }}>{client.name}</p>
          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{client.industry}</p>
        </div>
        <div className="text-right">
          <p style={{ color: '#94A3B8', fontSize: 9, textTransform: 'uppercase' }}>Assignee</p>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{incident.assignee}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Summary</p>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.7 }}>{incident.description}</p>
          </div>
          <Separator />

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Category', incident.category],
              ['Created', timeSince(incident.createdAt)],
              ['Last Updated', timeSince(incident.updatedAt)],
              ['Open Duration', timeSince(incident.createdAt).replace(' ago', '')],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                <p style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>{k}</p>
                <p style={{ color: '#334155', fontSize: 12, fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Related Alerts</p>
            <div className="space-y-2">
              {relatedAlerts.length === 0 ? (
                <div className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', color: '#94A3B8', fontSize: 12 }}>
                  No related alerts linked yet.
                </div>
              ) : (
                relatedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', borderLeft: `3px solid ${SEVERITY_CONFIG[alert.severity].color}` }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#334155', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</p>
                      <p style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>{toPublicId('alert', alert.id)}</p>
                    </div>
                    <SevBadge severity={alert.severity} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => onStatusChange('investigating')}>Investigate</Button>
              <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => onStatusChange('contained')}>Contain</Button>
              <Button variant="gold" size="sm" disabled={actionLoading} onClick={() => onStatusChange('resolved')}>Resolve</Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Incidents() {
  const { selectedClient } = useOutletContext<{ selectedClient: string }>();
  const {
    loading,
    error,
    actionError,
    actionLoadingId,
    incidents,
    clientsById,
    relatedAlertsByIncident,
    updateIncidentStatus,
  } = useIncidentsData(selectedClient);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const selected = useMemo(
    () => (selectedId ? incidents.find((incident) => incident.id === selectedId) ?? null : null),
    [incidents, selectedId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <X size={30} className="text-red-400" />
        <p style={{ color: '#64748B', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex relative page-shell-immersive" style={{ height: 'calc(100vh - 60px)' }}>
      {selected && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSelectedId(null)} />}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <div className="bg-white px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Flame size={18} style={{ color: '#CB5229' }} />
          <h1 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0 }}>Incident Response</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FBF0EC', color: '#CB5229' }}>
            {incidents.filter((i) => i.status !== 'resolved').length} active
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="default" size="sm" disabled><Plus size={13} />New Incident</Button>
            <div className="flex gap-0.5 p-1 rounded-lg border border-slate-200 bg-white">
              {(['kanban', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{ backgroundColor: viewMode === mode ? '#E6F7F9' : 'transparent', color: viewMode === mode ? '#1AABBA' : '#94A3B8' }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#FBF0EC', color: '#CB5229', border: '1px solid #F5C5B0' }}>
            {actionError}
          </div>
        )}

        {viewMode === 'kanban' ? (
          <div className="flex gap-4 p-4 md:p-5 flex-1 overflow-x-auto overflow-y-hidden">
            {COLS.map((col) => {
              const colInc = incidents.filter((i) => i.status === col.key);
              return (
                <div key={col.key} className="flex flex-col rounded-xl bg-white overflow-hidden" style={{ minWidth: 270, width: 270, border: '1px solid #E2E8F0', flexShrink: 0 }}>
                  <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: col.bg, borderBottom: `2px solid ${col.color}25` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span style={{ color: col.color, fontSize: 12, fontWeight: 700 }}>{col.label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${col.color}25`, color: col.color }}>{colInc.length}</span>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                      {colInc.map((inc) => {
                        const client = clientsById[inc.clientId] ?? clientsById['unknown-client'];
                        const isSelected = selectedId === inc.id;
                        return (
                          <div
                            key={inc.id}
                            onClick={() => setSelectedId(isSelected ? null : inc.id)}
                            className="rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-md"
                            style={{
                              backgroundColor: isSelected ? '#FAFAFA' : '#FFFFFF',
                              border: `1px solid ${isSelected ? `${SEVERITY_CONFIG[inc.severity].color}60` : '#F1F5F9'}`,
                              boxShadow: isSelected ? `0 2px 12px ${SEVERITY_CONFIG[inc.severity].color}20` : '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div className="flex items-start gap-2 mb-2.5">
                              <div className="w-1 h-full min-h-[14px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: SEVERITY_CONFIG[inc.severity].color }} />
                              <p style={{ color: '#334155', fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{inc.title}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-3 mb-2">
                              <SevBadge severity={inc.severity} />
                              <TLPBadge tlp={inc.tlp} />
                            </div>
                            <div className="flex items-center justify-between pl-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                                <span style={{ color: '#94A3B8', fontSize: 10 }}>{client.shortName}</span>
                              </div>
                              <span style={{ color: '#CBD5E1', fontSize: 10 }}>{timeSince(inc.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                      {colInc.length === 0 && <div className="text-center py-8" style={{ color: '#CBD5E1', fontSize: 12 }}>No incidents</div>}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead style={{ width: 90 }}>Severity</TableHead>
                  <TableHead style={{ width: 110 }} className="hidden sm:table-cell">Client</TableHead>
                  <TableHead style={{ width: 120 }}>Status</TableHead>
                  <TableHead style={{ width: 80 }} className="hidden md:table-cell">TLP</TableHead>
                  <TableHead style={{ width: 100 }} className="hidden md:table-cell">Assignee</TableHead>
                  <TableHead style={{ width: 90 }} className="hidden sm:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => {
                  const client = clientsById[inc.clientId] ?? clientsById['unknown-client'];
                  const isSelected = selectedId === inc.id;
                  return (
                    <TableRow key={inc.id} onClick={() => setSelectedId(isSelected ? null : inc.id)} data-state={isSelected ? 'selected' : undefined} style={{ borderLeft: `3px solid ${SEVERITY_CONFIG[inc.severity].color}` }}>
                      <TableCell>
                        <p style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>{inc.title}</p>
                        <p style={{ color: '#CBD5E1', fontSize: 10 }}>{toPublicId('incident', inc.id)} - {inc.category}</p>
                      </TableCell>
                      <TableCell><SevBadge severity={inc.severity} /></TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                          <span style={{ color: client.color, fontSize: 12, fontWeight: 500 }}>{client.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={inc.status} /></TableCell>
                      <TableCell className="hidden md:table-cell"><TLPBadge tlp={inc.tlp} /></TableCell>
                      <TableCell style={{ color: '#64748B', fontSize: 12 }} className="hidden md:table-cell">{inc.assignee}</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontSize: 11 }} className="hidden sm:table-cell">{timeSince(inc.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selected && (
        <div className={['fixed inset-y-[60px] right-0 z-30 w-full sm:w-[440px]', 'lg:static lg:w-[440px] lg:shrink-0 lg:h-full'].join(' ')}>
          <IncidentDetail
            incident={selected}
            client={(clientsById[selected.clientId] ?? clientsById['unknown-client']) as IncidentClient}
            relatedAlerts={(relatedAlertsByIncident[selected.id] ?? []).map((alert) => ({ id: alert.id, title: alert.title, severity: alert.severity }))}
            actionLoading={actionLoadingId === selected.id}
            onClose={() => setSelectedId(null)}
            onStatusChange={(status) => {
              void updateIncidentStatus(selected.id, status);
            }}
          />
        </div>
      )}
    </div>
  );
}
