export type ClientHealth = 'healthy' | 'warning' | 'critical';
export type ClientContract = 'trial' | 'active' | 'suspended' | 'churned';
export type ViewMode = 'grid' | 'table';
export type SortDirection = 'asc' | 'desc';
export type SortKey = 'name' | 'status' | 'agents' | 'events' | 'alerts';

export interface ExtendedClient {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  industry: string;
  siemTechnology: string;
  color: string;
  initials: string;
  status: ClientHealth;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: ClientContract;
  contractStart: string;
  contractEnd: string;
  vpnCidr: string;
  deployStatus: string;
  isActive: boolean;
  agentsCount: number;
  eventsPerDay: number;
  openAlerts: number;
  criticalAlerts: number;
  incidentCount: number;
  lastSeen: string;
}

export const STATUS_META: Record<
  ClientHealth,
  { label: string; color: string; bg: string; border: string }
> = {
  healthy: { label: 'Healthy', color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7' },
  warning: { label: 'Warning', color: '#C8980E', bg: '#FEF7E0', border: '#F5D878' },
  critical: { label: 'Critical', color: '#CB5229', bg: '#FBF0EC', border: '#F5C5B0' },
};

export const CONTRACT_META: Record<ClientContract, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10B981', bg: '#D1FAE5' },
  trial: { label: 'Trial', color: '#1AABBA', bg: '#E6F7F9' },
  suspended: { label: 'Suspended', color: '#C8980E', bg: '#FEF7E0' },
  churned: { label: 'Churned', color: '#94A3B8', bg: '#F1F5F9' },
};
