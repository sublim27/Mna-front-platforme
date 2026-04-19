import { AlertTriangle, Pencil, Server, Shield, XCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { CONTRACT_META, STATUS_META, type ExtendedClient } from './types';
import { formatEvents } from './utils';

export function ClientCard({
  client,
  onEdit,
}: {
  client: ExtendedClient;
  onEdit: () => void;
}) {
  const statusMeta = STATUS_META[client.status];
  const contractMeta = CONTRACT_META[client.contractStatus];

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200" style={{ borderColor: '#E2E8F0' }}>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${client.color}, #F0BC2C)` }} />
      <CardContent className="pt-4 pb-4 px-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center rounded-xl text-white font-bold shrink-0"
              style={{ width: 44, height: 44, backgroundColor: client.color, fontSize: 14, boxShadow: `0 4px 14px ${client.color}40` }}
            >
              {client.initials}
            </div>
            <div className="min-w-0">
              <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 14, margin: 0 }} className="truncate">{client.name}</p>
              <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }} className="truncate">{client.industry}</p>
              <p style={{ color: '#64748B', fontSize: 10, margin: 0 }} className="truncate">SIEM: {client.siemTechnology}</p>
            </div>
          </div>
          <button onClick={onEdit} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 shrink-0">
            <Pencil size={14} style={{ color: '#1AABBA' }} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
            {statusMeta.label}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: contractMeta.bg, color: contractMeta.color }}>
            {contractMeta.label}
          </span>
          {client.criticalAlerts > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FBF0EC', color: '#CB5229', border: '1px solid #F5C5B0' }}>
              <XCircle size={10} /> {client.criticalAlerts} critical
            </span>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Server, label: 'Agents', value: client.agentsCount.toLocaleString(), color: '#1AABBA' },
            { icon: Zap, label: 'Events/Day', value: formatEvents(client.eventsPerDay), color: '#F0BC2C' },
            { icon: Shield, label: 'Alerts', value: client.openAlerts, color: '#CB5229' },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="text-center rounded-lg py-2" style={{ backgroundColor: '#F8FAFC' }}>
                <Icon size={13} style={{ color: metric.color, margin: '0 auto 2px' }} />
                <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 13, margin: 0 }}>{metric.value}</p>
                <p style={{ color: '#94A3B8', fontSize: 10, margin: 0 }}>{metric.label}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: client.status === 'healthy' ? '#10B981' : client.status === 'warning' ? '#C8980E' : '#CB5229' }} />
            <span style={{ color: '#64748B', fontSize: 11 }}>Last seen {client.lastSeen}</span>
          </div>
          <span style={{ color: '#94A3B8', fontSize: 11 }}>
            {client.incidentCount} incident{client.incidentCount !== 1 ? 's' : ''}
          </span>
        </div>

        <Button onClick={onEdit} variant="outline" size="sm" className="w-full gap-2 text-xs sm:hidden" style={{ borderColor: '#1AABBA', color: '#1AABBA' }}>
          <Pencil size={12} /> Edit Client
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmptyClientsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed" style={{ borderColor: '#E2E8F0', backgroundColor: '#FCFDFE' }}>
      <AlertTriangle size={36} className="mb-3" style={{ color: '#CBD5E1' }} />
      <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>No clients match your current filters.</p>
      <button onClick={onClear} className="mt-2 text-sm" style={{ color: '#1AABBA' }}>Clear filters</button>
    </div>
  );
}
