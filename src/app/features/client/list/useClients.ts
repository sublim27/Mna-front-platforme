import { useCallback, useMemo, useState } from 'react';
import { fetchClients, updateClient, type ClientListItem } from '../client-api';
import {
  type ClientContract,
  type ClientHealth,
  type ExtendedClient,
  type SortDirection,
  type SortKey,
  type ViewMode,
} from './types';
import { getInitials, timeAgo } from './utils';

function inferHealth(openAlerts: number, criticalAlerts: number): ClientHealth {
  if (criticalAlerts > 0) return 'critical';
  if (openAlerts > 0) return 'warning';
  return 'healthy';
}

function toExtendedClient(client: ClientListItem): ExtendedClient {
  const totalAlerts = client.stats?.total ?? 0;
  const openAlerts = client.stats?.open ?? 0;
  const criticalAlerts = client.stats?.critical ?? 0;

  return {
    id: client.id,
    slug: client.slug,
    name: client.name,
    shortName: client.shortName,
    industry: client.industry,
    siemTechnology: client.siemTechnology || 'Unknown SIEM',
    color: client.color,
    initials: getInitials(client.shortName || client.name),
    status: inferHealth(openAlerts, criticalAlerts),
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone ?? '',
    contractStatus: client.contractStatus as ClientContract,
    contractStart: client.contractStart?.slice(0, 10) ?? '',
    contractEnd: client.contractEnd?.slice(0, 10) ?? '',
    vpnCidr: client.vpnCidr,
    deployStatus: client.deployStatus,
    isActive: client.isActive,
    agentsCount: Math.max(0, Math.round(totalAlerts / 8)),
    eventsPerDay: totalAlerts * 240,
    openAlerts,
    criticalAlerts,
    incidentCount: Math.max(0, Math.round(openAlerts / 3)),
    lastSeen: timeAgo(client.updatedAt),
  };
}

function compareClients(a: ExtendedClient, b: ExtendedClient, key: SortKey, direction: SortDirection) {
  const factor = direction === 'asc' ? 1 : -1;
  if (key === 'name') return a.name.localeCompare(b.name) * factor;
  if (key === 'status') return a.status.localeCompare(b.status) * factor;
  if (key === 'agents') return (a.agentsCount - b.agentsCount) * factor;
  if (key === 'events') return (a.eventsPerDay - b.eventsPerDay) * factor;
  return (a.openAlerts - b.openAlerts) * factor;
}

export function useClients() {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientHealth>('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState<'all' | ClientContract>('all');
  const [view, setView] = useState<ViewMode>('grid');

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const [editingClient, setEditingClient] = useState<ExtendedClient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await fetchClients();
      setClients(raw.map(toExtendedClient));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (updated: ExtendedClient) => {
    const payload = {
      name: updated.name,
      shortName: updated.shortName,
      industry: updated.industry,
      siemTechnology: updated.siemTechnology,
      color: updated.color,
      contactName: updated.contactName,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      contractStatus: updated.contractStatus,
      contractEnd: updated.contractEnd || undefined,
      vpnCidr: updated.vpnCidr,
    };

    await updateClient(updated.slug, payload);
    setClients((prev) =>
      prev.map((client) => (client.id === updated.id ? { ...client, ...updated, initials: getInitials(updated.shortName || updated.name) } : client)),
    );
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }, [sortKey]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setIndustryFilter('all');
    setContractFilter('all');
  }, []);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return clients
      .filter((client) => {
        if (statusFilter !== 'all' && client.status !== statusFilter) return false;
        if (industryFilter !== 'all' && client.industry !== industryFilter) return false;
        if (contractFilter !== 'all' && client.contractStatus !== contractFilter) return false;
        if (!searchTerm) return true;
        return (
          client.name.toLowerCase().includes(searchTerm) ||
          client.shortName.toLowerCase().includes(searchTerm) ||
          client.slug.toLowerCase().includes(searchTerm) ||
          client.contactEmail.toLowerCase().includes(searchTerm) ||
          client.siemTechnology.toLowerCase().includes(searchTerm)
        );
      })
      .sort((a, b) => compareClients(a, b, sortKey, sortDir));
  }, [clients, search, statusFilter, industryFilter, contractFilter, sortKey, sortDir]);

  const industries = useMemo(
    () => Array.from(new Set(clients.map((client) => client.industry))).sort((a, b) => a.localeCompare(b)),
    [clients],
  );

  const kpis = useMemo(() => {
    return {
      total: clients.length,
      healthy: clients.filter((client) => client.status === 'healthy').length,
      warning: clients.filter((client) => client.status === 'warning').length,
      critical: clients.filter((client) => client.status === 'critical').length,
      agents: clients.reduce((acc, client) => acc + client.agentsCount, 0),
      events: clients.reduce((acc, client) => acc + client.eventsPerDay, 0),
    };
  }, [clients]);

  return {
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
    hasActiveFilters: Boolean(search || statusFilter !== 'all' || industryFilter !== 'all' || contractFilter !== 'all'),
    load,
    handleSave,
    handleSort,
    clearFilters,
  };
}
