import { useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  LayoutGrid,
  List,
  Plus,
  Search,
  Server,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ClientCard, EmptyClientsState } from './list/ClientCard';
import { ClientsTable } from './list/ClientsTable';
import { EditClientDrawer } from './list/EditClientDrawer';
import { useClients } from './list/useClients';
import { PageHero, PageShell } from '../../components/layout/page-shell';
import type { ClientContract, ClientHealth } from './list/types';
import { formatEvents } from './list/utils';

const SELECT_STYLE: CSSProperties = {
  height: 36,
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  backgroundColor: '#fff',
  paddingLeft: 10,
  paddingRight: 10,
  fontSize: 13,
  color: '#334155',
  outline: 'none',
};

export default function Clients() {
  const navigate = useNavigate();
  const {
    clients,
    filtered,
    kpis,
    industries,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    industryFilter,
    setIndustryFilter,
    contractFilter,
    setContractFilter,
    view,
    setView,
    sortKey,
    sortDir,
    editingClient,
    setEditingClient,
    hasActiveFilters,
    load,
    handleSave,
    handleSort,
    clearFilters,
  } = useClients();

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as 'all' | ClientHealth);
  };

  const handleContractFilterChange = (value: string) => {
    setContractFilter(value as 'all' | ClientContract);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <XCircle size={32} className="text-red-400" />
        <p style={{ color: '#64748B', fontSize: 14 }}>{error}</p>
        <Button onClick={load} variant="outline" style={{ borderColor: '#1AABBA', color: '#1AABBA' }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <PageShell className="max-w-7xl">
      <PageHero
        title="Client Registry"
        subtitle="Manage tenant profile, contract state, and operational health from one place."
        actions={(
          <Button
            onClick={() => navigate('/add-client')}
            className="gap-2"
            style={{ backgroundColor: '#1AABBA', color: '#fff' }}
          >
            <Plus size={15} /> Add Client
          </Button>
        )}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Clients', value: kpis.total, color: '#1AABBA', icon: Building2 },
          { label: 'Healthy', value: kpis.healthy, color: '#10B981', icon: CheckCircle2 },
          { label: 'Warning', value: kpis.warning, color: '#C8980E', icon: AlertTriangle },
          { label: 'Critical', value: kpis.critical, color: '#CB5229', icon: XCircle },
          { label: 'Total Agents', value: kpis.agents.toLocaleString(), color: '#1AABBA', icon: Server },
          { label: 'Events / Day', value: formatEvents(kpis.events), color: '#F0BC2C', icon: Zap },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} style={{ borderColor: '#E2E8F0' }}>
              <CardContent className="px-4 py-3 flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: `${kpi.color}18`,
                    border: `1px solid ${kpi.color}30`,
                  }}
                >
                  <Icon size={15} style={{ color: kpi.color }} />
                </div>
                <div className="min-w-0">
                  <p
                    style={{
                      color: '#0F172A',
                      fontWeight: 800,
                      fontSize: 18,
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {kpi.value}
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }} className="truncate">
                    {kpi.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
              style={{ borderColor: '#E2E8F0', width: 220, fontSize: 13 }}
            />
          </div>

          <select style={SELECT_STYLE} value={statusFilter} onChange={(event) => handleStatusFilterChange(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <select style={SELECT_STYLE} value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
            <option value="all">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>

          <select style={SELECT_STYLE} value={contractFilter} onChange={(event) => handleContractFilterChange(event.target.value)}>
            <option value="all">All Contracts</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="churned">Churned</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ backgroundColor: '#FBF0EC', color: '#CB5229', border: '1px solid #F5C5B0' }}
            >
              <X size={10} /> Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            {([
              ['grid', LayoutGrid],
              ['table', List],
            ] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className="flex items-center justify-center w-9 h-9 transition-colors"
                style={{
                  backgroundColor: view === mode ? '#1AABBA' : '#fff',
                  color: view === mode ? '#fff' : '#94A3B8',
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <span style={{ color: '#64748B', fontSize: 13 }}>
          Showing <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> of{' '}
          <strong style={{ color: '#0F172A' }}>{clients.length}</strong> clients
        </span>
      </div>

      {view === 'grid' ? (
        filtered.length === 0 ? (
          <EmptyClientsState onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={() => setEditingClient(client)}
              />
            ))}
          </div>
        )
      ) : (
        <ClientsTable
          clients={filtered}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={setEditingClient}
        />
      )}

      {editingClient && (
        <EditClientDrawer
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSave}
        />
      )}
    </PageShell>
  );
}
