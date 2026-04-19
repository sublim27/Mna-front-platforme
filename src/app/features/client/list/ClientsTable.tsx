import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CONTRACT_META, STATUS_META, type ExtendedClient, type SortKey } from './types';
import { formatEvents } from './utils';

export function ClientsTable({
  clients,
  sortKey,
  sortDir,
  onSort,
  onEdit,
}: {
  clients: ExtendedClient[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  onEdit: (client: ExtendedClient) => void;
}) {
  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp size={12} style={{ color: '#1AABBA' }} /> : <ArrowDown size={12} style={{ color: '#1AABBA' }} />;
  };

  return (
    <Card style={{ borderColor: '#E2E8F0', overflow: 'hidden' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              {[{ key: 'name' as SortKey, label: 'Client' }, { key: 'status' as SortKey, label: 'Status' }, null, { key: 'agents' as SortKey, label: 'Agents' }, { key: 'events' as SortKey, label: 'Events/Day' }, { key: 'alerts' as SortKey, label: 'Open Alerts' }, null, null].map((column, index) =>
                column ? (
                  <th key={column.key} style={{ padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    <button onClick={() => onSort(column.key)} className="flex items-center gap-1.5" style={{ color: sortKey === column.key ? '#1AABBA' : '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {column.label} {sortIcon(column.key)}
                    </button>
                  </th>
                ) : (
                  <th key={index} style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {index === 2 ? 'Contract' : index === 6 ? 'Last Seen' : ''}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16" style={{ color: '#94A3B8', fontSize: 13 }}>
                  No clients match your filters.
                </td>
              </tr>
            ) : (
              clients.map((client, index) => {
                const statusMeta = STATUS_META[client.status];
                const contractMeta = CONTRACT_META[client.contractStatus];
                return (
                  <tr key={client.id} style={{ borderBottom: index < clients.length - 1 ? '1px solid #F8FAFC' : 'none' }} className="hover:bg-slate-50/60 transition-colors">
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-lg text-white font-bold shrink-0" style={{ width: 36, height: 36, backgroundColor: client.color, fontSize: 11, boxShadow: `0 2px 8px ${client.color}30` }}>
                          {client.initials}
                        </div>
                        <div>
                          <p style={{ color: '#0F172A', fontWeight: 600, fontSize: 13, margin: 0 }}>{client.name}</p>
                          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{client.industry} - {client.siemTechnology}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: contractMeta.bg, color: contractMeta.color }}>
                        {contractMeta.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontSize: 13, fontWeight: 500 }}>{client.agentsCount.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontSize: 13, fontWeight: 500 }}>
                      {formatEvents(client.eventsPerDay)}
                      <span style={{ color: '#CBD5E1', fontSize: 11 }}>/day</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>{client.openAlerts}</span>
                        {client.criticalAlerts > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FBF0EC', color: '#CB5229' }}>
                            {client.criticalAlerts} crit
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>{client.lastSeen}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Button variant="outline" size="sm" onClick={() => onEdit(client)} className="gap-1.5 text-xs whitespace-nowrap" style={{ borderColor: '#1AABBA', color: '#1AABBA' }}>
                        <Pencil size={12} /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
