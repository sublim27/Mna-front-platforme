import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { Search, Terminal, Download, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { LOG_ENTRIES, CLIENTS, SEVERITY_CONFIG, SOURCE_TYPE_CONFIG, type LogEntry, type Severity } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const SEV_COLORS: Record<Severity, { dot: string; row: string }> = {
  critical: { dot: '#CB5229', row: '#FBF0EC40' },
  high:     { dot: '#C8980E', row: '#FEF7E040' },
  medium:   { dot: '#1AABBA', row: '#E6F7F940' },
  low:      { dot: '#94A3B8', row: 'transparent' },
  info:     { dot: '#CBD5E1', row: 'transparent' },
};

function SevDot({ severity }: { severity: Severity }) {
  return <div className="rounded-full shrink-0 mt-1.5" style={{ width: 7, height: 7, backgroundColor: SEV_COLORS[severity].dot }} />;
}

function LogRow({ log, expanded, onToggle }: { log: LogEntry; expanded: boolean; onToggle: () => void }) {
  const client = CLIENTS[log.clientId];
  const src    = SOURCE_TYPE_CONFIG[log.sourceType];
  const ts     = new Date(log.timestamp);

  return (
    <div style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: expanded ? '#FAFBFC' : 'transparent' }}>
      {/* Main Row */}
      <div
        className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors group"
        onClick={onToggle}
      >
        {/* Time */}
        <span style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', minWidth: 70, paddingTop: 2, flexShrink: 0 }}>
          {ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        {/* Severity dot */}
        <SevDot severity={log.severity} />

        {/* Client chip */}
        <span
          className="px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline"
          style={{ backgroundColor: client.bgColor, color: client.color, fontSize: 9, fontWeight: 700, border: `1px solid ${client.color}30` }}
        >
          {client.initials}
        </span>

        {/* Source */}
        <span style={{ color: '#CBD5E1', fontSize: 10, minWidth: 68, paddingTop: 2, flexShrink: 0 }} className="hidden md:block">
          {src.label}
        </span>

        {/* Host */}
        <span style={{ color: '#1AABBA', fontSize: 11, fontFamily: 'monospace', minWidth: 120, paddingTop: 1, flexShrink: 0 }} className="hidden md:block">
          {log.host}
        </span>

        {/* Message */}
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
          {expanded
            ? <ChevronDown size={12} className="text-slate-400" />
            : <ChevronRight size={12} className="text-slate-400" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <span style={{ color: '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Event Details — {log.eventId}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2 p-4 bg-white" style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {[
              ['Source IP', log.sourceIp],
              ['Destination IP', log.destIp || '—'],
              ['Username', log.username || '—'],
              ['Host', log.host],
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
  const [search, setSearch]         = useState('');
  const [kql, setKql]               = useState('');
  const [sevFilter, setSevFilter]   = useState('all');
  const [srcFilter, setSrcFilter]   = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => LOG_ENTRIES.filter(l => {
    if (selectedClient !== 'all' && l.clientId !== selectedClient) return false;
    if (sevFilter !== 'all' && l.severity !== sevFilter) return false;
    if (srcFilter !== 'all' && l.sourceType !== srcFilter) return false;
    const q = (kql || search).toLowerCase();
    if (q) return l.message.toLowerCase().includes(q) || l.sourceIp.includes(q) || l.host.toLowerCase().includes(q) || l.username.toLowerCase().includes(q) || l.eventId.toLowerCase().includes(q);
    return true;
  }), [selectedClient, sevFilter, srcFilter, search, kql]);

  const sevCounts = useMemo(() => ({
    critical: LOG_ENTRIES.filter(l => l.severity === 'critical').length,
    high:     LOG_ENTRIES.filter(l => l.severity === 'high').length,
    medium:   LOG_ENTRIES.filter(l => l.severity === 'medium').length,
    low:      LOG_ENTRIES.filter(l => l.severity === 'low').length,
    info:     LOG_ENTRIES.filter(l => l.severity === 'info').length,
  }), []);

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-4 md:px-6 py-4 space-y-3 bg-white" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <Terminal size={18} style={{ color: '#1AABBA' }} />
          <h1 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0 }}>Log Explorer</h1>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>{LOG_ENTRIES.length.toLocaleString()} events loaded</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex"><Download size={12} />Export</Button>
            <Button variant="ghost" size="icon-sm"><RefreshCw size={14} /></Button>
          </div>
        </div>

        {/* KQL input */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={kql}
            onChange={e => setKql(e.target.value)}
            placeholder='KQL: sourceIp:185.220.* AND severity:critical'
            className="w-full h-9 rounded-lg border border-teal/40 bg-teal-light/40 pl-9 pr-24 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal/30"
            style={{ color: '#1AABBA', caretColor: '#1AABBA' }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}
          >
            {filtered.length} results
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(s => {
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
            onChange={e => setSrcFilter(e.target.value)}
            className="ml-auto h-7 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="all">All Sources</option>
            {['firewall','endpoint','auth','ids','waf','email','cloud'].map(s => (
              <option key={s} value={s}>{SOURCE_TYPE_CONFIG[s as any].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}
      >
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 70 }}>Time</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 7 }}></span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 32 }} className="hidden sm:block">Client</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 68 }} className="hidden md:block">Source</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 120 }} className="hidden md:block">Host</span>
        <span style={{ color: '#CBD5E1', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>Message</span>
      </div>

      {/* Log stream */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Terminal size={36} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No log entries match the query</p>
          </div>
        ) : filtered.map(log => (
          <LogRow
            key={log.id}
            log={log}
            expanded={expandedId === log.id}
            onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
          />
        ))}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-4 px-5 py-2"
        style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}
      >
        <span style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>
          {filtered.length}/{LOG_ENTRIES.length} entries
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#10B981' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span style={{ color: '#94A3B8', fontSize: 10 }}>Live stream active — 1,842 eps</span>
        </div>
      </div>
    </div>
  );
}