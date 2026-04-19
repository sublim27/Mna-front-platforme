import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import { Search, Terminal, Download, RefreshCw, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import {
  SEVERITY_CONFIG,
  SOURCE_TYPE_CONFIG,
  type Severity,
  type SourceType,
} from '../config/siem-config';
import { Button } from '../components/ui/button';
import { useLogsData, type LogViewEntry } from '../features/logs/useLogsData';
import { resolveSecureRef, toPublicId } from '../lib/public-ids';

const SEV_COLORS: Record<Severity, { dot: string; row: string }> = {
  critical: { dot: '#CB5229', row: '#FBF0EC40' },
  high: { dot: '#C8980E', row: '#FEF7E040' },
  medium: { dot: '#1AABBA', row: '#E6F7F940' },
  low: { dot: '#94A3B8', row: 'transparent' },
  info: { dot: '#CBD5E1', row: 'transparent' },
};

const SOURCE_OPTIONS: SourceType[] = ['firewall', 'endpoint', 'auth', 'ids', 'waf', 'email', 'cloud'];
const CORRELATION_META = {
  trigger: { label: 'Trigger', color: '#CB5229', bg: '#FBF0EC' },
  context: { label: 'Context', color: '#1AABBA', bg: '#E6F7F9' },
  related: { label: 'Related', color: '#64748B', bg: '#F1F5F9' },
} as const;

function fallbackClient(clientId: string) {
  const shortName = clientId.replace(/^client-/, '').toUpperCase();
  return {
    id: clientId,
    name: clientId,
    shortName,
    color: '#64748B',
    bgColor: '#F1F5F9',
    initials: shortName.slice(0, 2) || 'NA',
    siemTechnology: 'Unknown SIEM',
  };
}

function SevDot({ severity }: { severity: Severity }) {
  return <div className="rounded-full shrink-0 mt-1.5" style={{ width: 7, height: 7, backgroundColor: SEV_COLORS[severity].dot }} />;
}

function LogRow({
  log,
  expanded,
  onToggle,
  clientsById,
}: {
  log: LogViewEntry;
  expanded: boolean;
  onToggle: () => void;
  clientsById: Record<string, { id: string; name: string; shortName: string; color: string; bgColor: string; initials: string; siemTechnology: string }>;
}) {
  const client = clientsById[log.clientId] ?? fallbackClient(log.clientId);
  const src = SOURCE_TYPE_CONFIG[log.sourceType] ?? { label: log.sourceType, icon: '?' };
  const ts = new Date(log.timestamp);
  const correlationMeta = log.correlationType ? CORRELATION_META[log.correlationType] : null;

  return (
    <div style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: expanded ? '#FAFBFC' : 'transparent' }}>
      <div className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors group" onClick={onToggle}>
        <span style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', minWidth: 70, paddingTop: 2, flexShrink: 0 }}>
          {ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <SevDot severity={log.severity} />

        <span
          className="px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline"
          style={{ backgroundColor: client.bgColor, color: client.color, fontSize: 9, fontWeight: 700, border: `1px solid ${client.color}30` }}
        >
          {client.initials}
        </span>

        <span style={{ color: '#CBD5E1', fontSize: 10, minWidth: 68, paddingTop: 2, flexShrink: 0 }} className="hidden md:block">
          {src.label}
        </span>

        <span style={{ color: '#1AABBA', fontSize: 11, fontFamily: 'monospace', minWidth: 120, paddingTop: 1, flexShrink: 0 }} className="hidden md:block">
          {log.host}
        </span>

        {correlationMeta && (
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 hidden lg:inline"
            style={{ color: correlationMeta.color, backgroundColor: correlationMeta.bg }}
          >
            {correlationMeta.label}
          </span>
        )}

        <span
          style={{
            color: log.severity === 'critical' ? '#334155' : log.severity === 'high' ? '#475569' : '#64748B',
            fontSize: 11,
            fontFamily: 'monospace',
            flex: 1,
            overflow: expanded ? 'visible' : 'hidden',
            textOverflow: expanded ? 'unset' : 'ellipsis',
            whiteSpace: expanded ? 'normal' : 'nowrap',
            lineHeight: 1.5,
          }}
        >
          {log.message}
        </span>

        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {expanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
        </button>
      </div>

      {expanded && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <span style={{ color: '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Event Details - {toPublicId('log', log.id)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2 p-4 bg-white" style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {[
              ['Source IP', log.sourceIp],
              ['Destination IP', log.destIp || '-'],
              ['Username', log.username || '-'],
              ['Host', log.host],
              ['Correlation', log.correlationType ? CORRELATION_META[log.correlationType].label : '-'],
              ['Rule', log.ruleDescription || '-'],
              ['SIEM', client.siemTechnology],
              ['Timestamp', ts.toISOString()],
              ['Client', client.name],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ color: '#94A3B8' }}>{k}: </span>
                <span style={{ color: '#334155' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3 bg-white border-t border-slate-100">
            <p style={{ color: '#94A3B8', fontSize: 10, marginBottom: 6 }}>Raw Message</p>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: 11, color: '#1AABBA', lineHeight: 1.6, wordBreak: 'break-all' }}>
              {log.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Logs() {
  const { selectedClient } = useOutletContext<{ selectedClient: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertRef = (searchParams.get('alertRef') || '').trim();
  const legacyAlertId = (searchParams.get('alertId') || '').trim();
  const resolvedAlertId = alertRef ? resolveSecureRef('alert', alertRef) : null;
  const alertIdFilter = resolvedAlertId || legacyAlertId;
  const { loading, error, logs, clientsById } = useLogsData(selectedClient, alertIdFilter || null);
  const isCorrelatedView = alertIdFilter.length > 0;

  const [kql, setKql] = useState('');
  const [sevFilter, setSevFilter] = useState<'all' | Severity>('all');
  const [srcFilter, setSrcFilter] = useState<'all' | SourceType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => logs.filter((l) => {
      if (alertIdFilter && l.eventId !== alertIdFilter) return false;
      if (sevFilter !== 'all' && l.severity !== sevFilter) return false;
      if (srcFilter !== 'all' && l.sourceType !== srcFilter) return false;
      const q = kql.toLowerCase();
      if (q) {
        return (
          l.message.toLowerCase().includes(q) ||
          l.sourceIp.toLowerCase().includes(q) ||
          l.host.toLowerCase().includes(q) ||
          l.username.toLowerCase().includes(q) ||
          l.eventId.toLowerCase().includes(q)
        );
      }
      return true;
    }),
    [alertIdFilter, kql, logs, sevFilter, srcFilter],
  );

  useEffect(() => {
    if (!alertIdFilter) return;
    setExpandedId((current) => current ?? logs[0]?.id ?? null);
  }, [alertIdFilter, logs]);

  const sevCounts = useMemo(
    () => ({
      critical: logs.filter((l) => l.severity === 'critical').length,
      high: logs.filter((l) => l.severity === 'high').length,
      medium: logs.filter((l) => l.severity === 'medium').length,
      low: logs.filter((l) => l.severity === 'low').length,
      info: logs.filter((l) => l.severity === 'info').length,
    }),
    [logs],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle size={30} className="text-red-400" />
        <p style={{ color: '#64748B', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col page-shell-immersive bg-white" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="px-4 md:px-6 py-4 space-y-3 bg-white" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <Terminal size={18} style={{ color: '#1AABBA' }} />
          <h1 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0 }}>Log Explorer</h1>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>
            {isCorrelatedView
              ? `${logs.length.toLocaleString()} correlated logs`
              : `${logs.length.toLocaleString()} events loaded`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex"><Download size={12} />Export</Button>
            <Button variant="ghost" size="icon-sm"><RefreshCw size={14} /></Button>
          </div>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={kql}
            onChange={(e) => setKql(e.target.value)}
            placeholder="KQL: sourceIp:185.220.* AND severity:critical"
            className="w-full h-9 rounded-lg border border-teal/40 bg-teal-light/40 pl-9 pr-24 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal/30"
            style={{ color: '#1AABBA', caretColor: '#1AABBA' }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}>
            {filtered.length} results
          </span>
        </div>

        {alertIdFilter && (
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded-md text-xs font-semibold"
              style={{ backgroundColor: '#E6F7F9', color: '#1AABBA', border: '1px solid #B8E8EE' }}
            >
              Correlated timeline for alert: {toPublicId('alert', alertIdFilter)}
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs font-medium"
              style={{ color: '#64748B' }}
            >
              Clear
            </button>
          </div>
        )}

        {alertRef && !resolvedAlertId && (
          <div
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: '#FEF7E0', color: '#C8980E', border: '1px solid #F5D878' }}
          >
            Secure alert link expired. Re-open logs from the alert page.
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map((s) => {
            const cfg = s !== 'all' ? SEVERITY_CONFIG[s] : null;
            const isActive = sevFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className="px-3 h-7 rounded-full text-xs font-medium border transition-all"
                style={{
                  backgroundColor: isActive ? (cfg?.bg ?? '#E6F7F9') : '#FFFFFF',
                  color: isActive ? (cfg?.color ?? '#1AABBA') : '#64748B',
                  borderColor: isActive ? (cfg?.color ?? '#1AABBA') : '#E2E8F0',
                }}
              >
                {s === 'all' ? 'All' : `${cfg?.label} (${sevCounts[s]})`}
              </button>
            );
          })}

          <select
            value={srcFilter}
            onChange={(e) => setSrcFilter(e.target.value as 'all' | SourceType)}
            className="ml-auto h-7 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="all">All Sources</option>
            {SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>{SOURCE_TYPE_CONFIG[source].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 70 }}>Time</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 7 }}></span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 32 }} className="hidden sm:block">Client</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 68 }} className="hidden md:block">Source</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 120 }} className="hidden md:block">Host</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>Message</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Terminal size={36} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No log entries match the query</p>
          </div>
        ) : (
          filtered.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              clientsById={clientsById}
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-4 px-5 py-2" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <span style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>
          {filtered.length}/{logs.length} entries
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#10B981' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span style={{ color: '#94A3B8', fontSize: 10 }}>Live stream active</span>
        </div>
      </div>
    </div>
  );
}
