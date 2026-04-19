export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';
export type SourceType = 'firewall' | 'ids' | 'endpoint' | 'auth' | 'waf' | 'email' | 'cloud';

export const SOURCE_TYPES: SourceType[] = ['firewall', 'endpoint', 'auth', 'ids', 'waf', 'email', 'cloud'];
export const ALERT_STATUSES: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive'];
export const INCIDENT_STATUSES: IncidentStatus[] = ['open', 'investigating', 'contained', 'resolved'];

export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; badgeClass: string }
> = {
  critical: { label: 'Critical', color: '#CB5229', bg: '#FBF0EC', border: '#F5C5B0', badgeClass: 'critical' },
  high: { label: 'High', color: '#C8980E', bg: '#FEF7E0', border: '#F5D878', badgeClass: 'high' },
  medium: { label: 'Medium', color: '#1AABBA', bg: '#E6F7F9', border: '#A0DDE4', badgeClass: 'medium' },
  low: { label: 'Low', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', badgeClass: 'low' },
  info: { label: 'Info', color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', badgeClass: 'info' },
};

export const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; icon: string }> = {
  firewall: { label: 'Firewall', icon: 'FW' },
  ids: { label: 'IDS/IPS', icon: 'IDS' },
  endpoint: { label: 'Endpoint', icon: 'EDR' },
  auth: { label: 'Authentication', icon: 'AUTH' },
  waf: { label: 'WAF', icon: 'WAF' },
  email: { label: 'Email Security', icon: 'MAIL' },
  cloud: { label: 'Cloud', icon: 'CLD' },
};

export function isSeverity(value: string): value is Severity {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low' || value === 'info';
}

export function isAlertStatus(value: string): value is AlertStatus {
  return value === 'new' || value === 'investigating' || value === 'resolved' || value === 'false_positive';
}

export function isSourceType(value: string): value is SourceType {
  return value === 'firewall'
    || value === 'ids'
    || value === 'endpoint'
    || value === 'auth'
    || value === 'waf'
    || value === 'email'
    || value === 'cloud';
}
