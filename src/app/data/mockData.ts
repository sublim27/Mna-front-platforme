export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';
export type SourceType = 'firewall' | 'ids' | 'endpoint' | 'auth' | 'waf' | 'email' | 'cloud';

export interface Client {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  initials: string;
  industry: string;
  agentsCount: number;
  eventsPerDay: number;
  status: 'healthy' | 'warning' | 'critical';
  lastSeen: string;
  openAlerts: number;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  clientId: string;
  sourceType: SourceType;
  sourceIp: string;
  destIp: string;
  timestamp: string;
  rule: string;
  assignee: string;
  count: number;
  mitre?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  assignee: string;
  description: string;
  alertCount: number;
  category: string;
  mitre: string;
  tlp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  clientId: string;
  sourceType: SourceType;
  severity: Severity;
  message: string;
  sourceIp: string;
  destIp: string;
  username: string;
  host: string;
  eventId: string;
}

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  threat: string;
  confidence: number;
  lastSeen: string;
  source: string;
  tags: string[];
}

/* ── Brand colour palette (light-theme) ── */
export const BRAND = {
  teal:       '#1AABBA',
  tealDark:   '#12889A',
  tealLight:  '#E6F7F9',
  gold:       '#F0BC2C',
  goldDark:   '#C8980E',
  goldLight:  '#FEF7E0',
  coral:      '#CB5229',
  coralDark:  '#A84020',
  coralLight: '#FBF0EC',
};

export const CLIENTS: Record<string, Client> = {
  'client-a': {
    id: 'client-a', name: 'Airbus Group', shortName: 'Airbus',
    color: '#1AABBA', bgColor: '#E6F7F9',
    initials: 'AB', industry: 'Aerospace & Defense',
    agentsCount: 847, eventsPerDay: 142300, status: 'warning', lastSeen: '1 min ago', openAlerts: 23,
  },
  'client-b': {
    id: 'client-b', name: 'BNP Paribas', shortName: 'BNP',
    color: '#CB5229', bgColor: '#FBF0EC',
    initials: 'BP', industry: 'Financial Services',
    agentsCount: 1240, eventsPerDay: 318700, status: 'critical', lastSeen: '30 sec ago', openAlerts: 41,
  },
  'client-c': {
    id: 'client-c', name: 'Crédit Agricole', shortName: 'Crédit Ag.',
    color: '#C8980E', bgColor: '#FEF7E0',
    initials: 'CA', industry: 'Banking',
    agentsCount: 632, eventsPerDay: 98400, status: 'healthy', lastSeen: '2 min ago', openAlerts: 7,
  },
  'client-d': {
    id: 'client-d', name: 'Orange Telecom', shortName: 'Orange',
    color: '#E07820', bgColor: '#FEF3E8',
    initials: 'OT', industry: 'Telecommunications',
    agentsCount: 2100, eventsPerDay: 527000, status: 'healthy', lastSeen: '45 sec ago', openAlerts: 12,
  },
  'client-e': {
    id: 'client-e', name: 'Total Energies', shortName: 'Total',
    color: '#2563EB', bgColor: '#EFF6FF',
    initials: 'TE', industry: 'Energy & Utilities',
    agentsCount: 489, eventsPerDay: 73600, status: 'warning', lastSeen: '5 min ago', openAlerts: 18,
  },
};

export const SEVERITY_CONFIG: Record<Severity, {
  label: string; color: string; bg: string; border: string; badgeClass: string;
}> = {
  critical: { label: 'Critical', color: '#CB5229', bg: '#FBF0EC', border: '#F5C5B0', badgeClass: 'critical' },
  high:     { label: 'High',     color: '#C8980E', bg: '#FEF7E0', border: '#F5D878', badgeClass: 'high' },
  medium:   { label: 'Medium',   color: '#1AABBA', bg: '#E6F7F9', border: '#A0DDE4', badgeClass: 'medium' },
  low:      { label: 'Low',      color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', badgeClass: 'low' },
  info:     { label: 'Info',     color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', badgeClass: 'info' },
};

export const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; icon: string }> = {
  firewall: { label: 'Firewall',       icon: '🛡️' },
  ids:      { label: 'IDS/IPS',        icon: '🔍' },
  endpoint: { label: 'Endpoint',       icon: '💻' },
  auth:     { label: 'Authentication', icon: '🔐' },
  waf:      { label: 'WAF',            icon: '🌐' },
  email:    { label: 'Email Security', icon: '📧' },
  cloud:    { label: 'Cloud',          icon: '☁️' },
};

export const ALERTS: Alert[] = [
  { id: 'ALT-001', title: 'Brute Force SSH Attack Detected', description: 'Multiple failed SSH login attempts from external IP targeting jump server.', severity: 'critical', status: 'investigating', clientId: 'client-a', sourceType: 'auth', sourceIp: '185.220.101.47', destIp: '10.12.0.5', timestamp: '2026-03-04T14:32:00Z', rule: 'SSH_BRUTE_FORCE_001', assignee: 'A. Dupont', count: 347, mitre: 'T1110.001' },
  { id: 'ALT-002', title: 'SQL Injection Attempt – Web Portal', description: 'WAF blocked SQL injection payload targeting the client portal authentication endpoint.', severity: 'high', status: 'new', clientId: 'client-b', sourceType: 'waf', sourceIp: '91.108.4.234', destIp: '172.16.8.12', timestamp: '2026-03-04T14:28:00Z', rule: 'WAF_SQLI_002', assignee: '', count: 12, mitre: 'T1190' },
  { id: 'ALT-003', title: 'Ransomware File Extension Activity', description: 'Suspicious file rename patterns (.locked extensions) detected on file server FS-PROD-02.', severity: 'critical', status: 'investigating', clientId: 'client-c', sourceType: 'endpoint', sourceIp: '192.168.4.87', destIp: '192.168.4.20', timestamp: '2026-03-04T14:15:00Z', rule: 'EDR_RANSOM_003', assignee: 'M. Bernard', count: 1, mitre: 'T1486' },
  { id: 'ALT-004', title: 'Anomalous Data Exfiltration', description: 'Unusual outbound traffic volume (>2 GB) to uncategorised external host via HTTPS.', severity: 'high', status: 'investigating', clientId: 'client-d', sourceType: 'firewall', sourceIp: '10.50.2.145', destIp: '45.33.32.156', timestamp: '2026-03-04T13:55:00Z', rule: 'FW_EXFIL_004', assignee: 'C. Martin', count: 1, mitre: 'T1048.002' },
  { id: 'ALT-005', title: 'Mimikatz Credential Dumping', description: 'Endpoint detection of credential dumping tool signature on workstation WRK-ENG-042.', severity: 'critical', status: 'new', clientId: 'client-a', sourceType: 'endpoint', sourceIp: '10.12.5.42', destIp: '', timestamp: '2026-03-04T13:44:00Z', rule: 'EDR_MIMIKATZ_005', assignee: '', count: 1, mitre: 'T1003.001' },
  { id: 'ALT-006', title: 'Phishing Campaign – Executive Targeting', description: 'Spear phishing email targeting C-suite executives with malicious Office document attachment.', severity: 'high', status: 'new', clientId: 'client-b', sourceType: 'email', sourceIp: '104.47.18.200', destIp: '172.16.0.1', timestamp: '2026-03-04T13:30:00Z', rule: 'EMAIL_PHISH_006', assignee: '', count: 8, mitre: 'T1566.001' },
  { id: 'ALT-007', title: 'Lateral Movement – Pass the Hash', description: 'Pass-the-hash authentication anomaly detected across multiple hosts in OT subnet.', severity: 'high', status: 'investigating', clientId: 'client-e', sourceType: 'auth', sourceIp: '10.80.1.33', destIp: '10.80.1.45', timestamp: '2026-03-04T13:15:00Z', rule: 'AUTH_PTH_007', assignee: 'L. Morel', count: 14, mitre: 'T1550.002' },
  { id: 'ALT-008', title: 'Port Scan – Internal Network', description: 'Systematic TCP SYN scan detected across /24 subnet during business hours.', severity: 'medium', status: 'resolved', clientId: 'client-c', sourceType: 'ids', sourceIp: '192.168.4.23', destIp: '192.168.4.0/24', timestamp: '2026-03-04T12:50:00Z', rule: 'IDS_PORTSCAN_008', assignee: 'M. Bernard', count: 254, mitre: 'T1046' },
  { id: 'ALT-009', title: 'Unauthorized Cloud API Access', description: 'Cloud API calls from unauthorized IP address, potential token compromise.', severity: 'high', status: 'new', clientId: 'client-d', sourceType: 'cloud', sourceIp: '203.0.113.55', destIp: 'api.azure.com', timestamp: '2026-03-04T12:35:00Z', rule: 'CLOUD_AUTHZ_009', assignee: '', count: 3, mitre: 'T1078.004' },
  { id: 'ALT-010', title: 'DDoS Attack – Public Web Server', description: 'Volumetric DDoS attack targeting public-facing web server. Peak traffic: 8.4 Gbps.', severity: 'critical', status: 'investigating', clientId: 'client-b', sourceType: 'firewall', sourceIp: '0.0.0.0/0', destIp: '89.234.157.254', timestamp: '2026-03-04T12:10:00Z', rule: 'FW_DDOS_010', assignee: 'A. Dupont', count: 1, mitre: 'T1498' },
  { id: 'ALT-011', title: 'Windows Event Log Cleared', description: 'Security event log cleared on domain controller DC-PROD-01. Potential evidence tampering.', severity: 'high', status: 'new', clientId: 'client-a', sourceType: 'endpoint', sourceIp: '10.12.0.1', destIp: '', timestamp: '2026-03-04T11:45:00Z', rule: 'EDR_LOGCLEAR_011', assignee: '', count: 1, mitre: 'T1070.001' },
  { id: 'ALT-012', title: 'Malware C2 Beacon Detected', description: 'Periodic outbound HTTP requests to known C2 infrastructure with beacon pattern.', severity: 'critical', status: 'investigating', clientId: 'client-e', sourceType: 'firewall', sourceIp: '10.80.3.67', destIp: '198.51.100.23', timestamp: '2026-03-04T11:20:00Z', rule: 'FW_C2_BEACON_012', assignee: 'L. Morel', count: 48, mitre: 'T1071.001' },
  { id: 'ALT-013', title: 'Privilege Escalation – sudo Abuse', description: 'Non-privileged user executed sudo commands outside authorized scope on Linux server.', severity: 'medium', status: 'false_positive', clientId: 'client-c', sourceType: 'auth', sourceIp: '192.168.4.15', destIp: '', timestamp: '2026-03-04T11:00:00Z', rule: 'AUTH_SUDO_013', assignee: 'M. Bernard', count: 4, mitre: 'T1548.003' },
  { id: 'ALT-014', title: 'Suspicious PowerShell Execution', description: 'Encoded PowerShell command execution with download cradle pattern on workstation.', severity: 'high', status: 'new', clientId: 'client-a', sourceType: 'endpoint', sourceIp: '10.12.3.88', destIp: '', timestamp: '2026-03-04T10:30:00Z', rule: 'EDR_POWERSHELL_014', assignee: '', count: 2, mitre: 'T1059.001' },
  { id: 'ALT-015', title: 'Firewall Rule Bypass Attempt', description: 'Traffic detected matching known tunnel obfuscation techniques to bypass firewall policy.', severity: 'medium', status: 'new', clientId: 'client-d', sourceType: 'firewall', sourceIp: '10.50.7.92', destIp: '8.8.8.8', timestamp: '2026-03-04T10:05:00Z', rule: 'FW_BYPASS_015', assignee: '', count: 6, mitre: 'T1572' },
  { id: 'ALT-016', title: 'Account Lockout Storm', description: 'Mass account lockout event across Active Directory – 87 accounts locked within 5 minutes.', severity: 'high', status: 'investigating', clientId: 'client-b', sourceType: 'auth', sourceIp: '172.16.2.101', destIp: '172.16.0.5', timestamp: '2026-03-04T09:40:00Z', rule: 'AUTH_LOCKOUT_016', assignee: 'A. Dupont', count: 87, mitre: 'T1110' },
  { id: 'ALT-017', title: 'Suspicious DNS Queries – DGA', description: 'High volume of NXDomain responses indicating Domain Generation Algorithm (DGA) activity.', severity: 'medium', status: 'new', clientId: 'client-e', sourceType: 'firewall', sourceIp: '10.80.4.12', destIp: '1.1.1.1', timestamp: '2026-03-04T09:15:00Z', rule: 'FW_DGA_017', assignee: '', count: 432, mitre: 'T1568.002' },
  { id: 'ALT-018', title: 'Insider Threat – After Hours Data Access', description: 'Large file downloads from DMS system detected at 02:30 AM from employee account.', severity: 'medium', status: 'investigating', clientId: 'client-c', sourceType: 'auth', sourceIp: '192.168.4.56', destIp: '192.168.4.200', timestamp: '2026-03-04T02:30:00Z', rule: 'UBA_INSIDER_018', assignee: 'M. Bernard', count: 1, mitre: 'T1078' },
  { id: 'ALT-019', title: 'Web Shell Upload Detected', description: 'PHP web shell uploaded to web server via file upload vulnerability in CMS.', severity: 'critical', status: 'resolved', clientId: 'client-b', sourceType: 'waf', sourceIp: '77.32.45.190', destIp: '172.16.8.15', timestamp: '2026-03-03T22:14:00Z', rule: 'WAF_WEBSHELL_019', assignee: 'A. Dupont', count: 1, mitre: 'T1505.003' },
  { id: 'ALT-020', title: 'RDP Exposed to Internet', description: 'RDP service (TCP/3389) found exposed directly to internet on server SRV-LEGACY-03.', severity: 'high', status: 'resolved', clientId: 'client-a', sourceType: 'firewall', sourceIp: '0.0.0.0/0', destIp: '10.12.8.3', timestamp: '2026-03-03T18:30:00Z', rule: 'FW_RDP_EXPOSED_020', assignee: 'C. Martin', count: 1, mitre: 'T1133' },
];

export const INCIDENTS: Incident[] = [
  { id: 'INC-001', title: 'APT Campaign – BNP Financial Data Targeting', severity: 'critical', status: 'investigating', clientId: 'client-b', createdAt: '2026-03-04T12:10:00Z', updatedAt: '2026-03-04T14:30:00Z', assignee: 'A. Dupont', description: 'Coordinated attack campaign targeting financial transaction systems. Initial access via phishing, lateral movement confirmed, DDoS as diversionary tactic.', alertCount: 12, category: 'APT', mitre: 'TA0001, TA0008, TA0009', tlp: 'RED' },
  { id: 'INC-002', title: 'Ransomware Outbreak – Crédit Agricole File Server', severity: 'critical', status: 'contained', clientId: 'client-c', createdAt: '2026-03-04T14:15:00Z', updatedAt: '2026-03-04T14:45:00Z', assignee: 'M. Bernard', description: 'Active ransomware deployment on file server FS-PROD-02. Affected shares have been isolated. Initial infection vector under investigation.', alertCount: 3, category: 'Ransomware', mitre: 'T1486, T1490', tlp: 'RED' },
  { id: 'INC-003', title: 'Credential Compromise – Airbus Engineering', severity: 'high', status: 'investigating', clientId: 'client-a', createdAt: '2026-03-04T13:44:00Z', updatedAt: '2026-03-04T14:15:00Z', assignee: 'A. Dupont', description: 'Credential dumping tool detected on engineering workstation. High risk of lateral movement to CAD systems containing sensitive aerospace designs.', alertCount: 4, category: 'Credential Access', mitre: 'T1003.001, T1110.001', tlp: 'AMBER' },
  { id: 'INC-004', title: 'C2 Malware – Total Energies OT Network', severity: 'critical', status: 'open', clientId: 'client-e', createdAt: '2026-03-04T11:20:00Z', updatedAt: '2026-03-04T13:00:00Z', assignee: 'L. Morel', description: 'Active C2 communication from OT network segment. Potential SCADA system compromise. ICS security team engaged.', alertCount: 7, category: 'Malware / C2', mitre: 'T1071.001, T1550.002', tlp: 'RED' },
  { id: 'INC-005', title: 'Insider Data Theft – Crédit Agricole', severity: 'high', status: 'investigating', clientId: 'client-c', createdAt: '2026-03-04T02:30:00Z', updatedAt: '2026-03-04T09:00:00Z', assignee: 'M. Bernard', description: 'Suspected insider threat exfiltrating customer data outside business hours. DLP alert correlated with UBA anomaly.', alertCount: 2, category: 'Insider Threat', mitre: 'T1078, T1048', tlp: 'AMBER' },
  { id: 'INC-006', title: 'Cloud API Key Compromise – Orange Telecom', severity: 'high', status: 'open', clientId: 'client-d', createdAt: '2026-03-04T12:35:00Z', updatedAt: '2026-03-04T13:30:00Z', assignee: 'C. Martin', description: 'Azure API key exposed and exploited. Unauthorized resource enumeration and data access in cloud tenant.', alertCount: 5, category: 'Cloud Security', mitre: 'T1078.004, T1530', tlp: 'AMBER' },
  { id: 'INC-007', title: 'DDoS Attack Mitigation – BNP Public Services', severity: 'high', status: 'contained', clientId: 'client-b', createdAt: '2026-03-04T12:10:00Z', updatedAt: '2026-03-04T14:00:00Z', assignee: 'A. Dupont', description: 'Volumetric DDoS attack mitigated through upstream scrubbing. Web application now stable. Attack attributed to hacktivist group.', alertCount: 3, category: 'DDoS', mitre: 'T1498', tlp: 'GREEN' },
  { id: 'INC-008', title: 'Phishing Campaign Response – Airbus', severity: 'medium', status: 'resolved', clientId: 'client-a', createdAt: '2026-03-03T09:00:00Z', updatedAt: '2026-03-03T16:00:00Z', assignee: 'C. Martin', description: 'Coordinated spear-phishing campaign targeting R&D team. 3 users clicked link, credentials reset, endpoints remediated.', alertCount: 8, category: 'Phishing', mitre: 'T1566.002', tlp: 'GREEN' },
];

export const LOG_ENTRIES: LogEntry[] = [
  { id: 'LOG-001', timestamp: '2026-03-04T14:33:01Z', clientId: 'client-a', sourceType: 'auth', severity: 'critical', message: 'Failed password for root from 185.220.101.47 port 52341 ssh2', sourceIp: '185.220.101.47', destIp: '10.12.0.5', username: 'root', host: 'JUMP-SRV-01', eventId: '4625' },
  { id: 'LOG-002', timestamp: '2026-03-04T14:32:58Z', clientId: 'client-b', sourceType: 'waf', severity: 'high', message: "WAF blocked request: SQL injection detected in parameter 'id' — payload: 1' OR '1'='1", sourceIp: '91.108.4.234', destIp: '172.16.8.12', username: '', host: 'WAF-EXT-01', eventId: 'WAF-1002' },
  { id: 'LOG-003', timestamp: '2026-03-04T14:32:45Z', clientId: 'client-c', sourceType: 'endpoint', severity: 'critical', message: 'File rename detected: document.docx -> document.docx.locked (Ransomware indicator)', sourceIp: '192.168.4.87', destIp: '192.168.4.20', username: 'jdupont', host: 'FS-PROD-02', eventId: 'EDR-7001' },
  { id: 'LOG-004', timestamp: '2026-03-04T14:32:10Z', clientId: 'client-d', sourceType: 'firewall', severity: 'high', message: 'DENY outbound TCP 10.50.2.145:49832 -> 45.33.32.156:443 bytes=2147483647', sourceIp: '10.50.2.145', destIp: '45.33.32.156', username: '', host: 'FW-PERIMETER-01', eventId: 'FW-3001' },
  { id: 'LOG-005', timestamp: '2026-03-04T14:31:55Z', clientId: 'client-e', sourceType: 'endpoint', severity: 'critical', message: 'Malware detected: Cobalt Strike beacon (C2: 198.51.100.23:443) on process explorer.exe', sourceIp: '10.80.3.67', destIp: '198.51.100.23', username: 'svc_scada', host: 'OT-WRK-07', eventId: 'EDR-9002' },
  { id: 'LOG-006', timestamp: '2026-03-04T14:31:30Z', clientId: 'client-a', sourceType: 'endpoint', severity: 'critical', message: 'Process created: powershell.exe -enc JABjAG...  (Encoded PowerShell detected)', sourceIp: '10.12.3.88', destIp: '', username: 'msmith', host: 'WRK-ENG-042', eventId: 'EDR-4001' },
  { id: 'LOG-007', timestamp: '2026-03-04T14:31:00Z', clientId: 'client-b', sourceType: 'auth', severity: 'high', message: 'Account locked: user j.martin@bnpparibas.com after 5 failed attempts from IP 172.16.2.101', sourceIp: '172.16.2.101', destIp: '172.16.0.5', username: 'j.martin', host: 'DC-PROD-01', eventId: '4740' },
  { id: 'LOG-008', timestamp: '2026-03-04T14:30:45Z', clientId: 'client-c', sourceType: 'ids', severity: 'medium', message: 'Snort Alert: ET SCAN Nmap Scripting Engine User-Agent Detected (nmap)', sourceIp: '192.168.4.23', destIp: '192.168.4.1', username: '', host: 'IDS-CORE-01', eventId: 'SID-2000537' },
  { id: 'LOG-009', timestamp: '2026-03-04T14:30:20Z', clientId: 'client-d', sourceType: 'cloud', severity: 'high', message: 'Azure: Unusual sign-in detected from IP 203.0.113.55 (TOR exit node) to subscription PROD-AZURE', sourceIp: '203.0.113.55', destIp: 'portal.azure.com', username: 'admin@orange.fr', host: 'AZURE-TENANT', eventId: 'AZURE-001' },
  { id: 'LOG-010', timestamp: '2026-03-04T14:30:00Z', clientId: 'client-e', sourceType: 'firewall', severity: 'medium', message: 'DNS query to DGA domain: xkqjhbvmnop.xyz (NXDOMAIN) — possible C2 callback', sourceIp: '10.80.4.12', destIp: '1.1.1.1', username: '', host: 'FW-OT-PERIMETER', eventId: 'FW-DNS-001' },
  { id: 'LOG-011', timestamp: '2026-03-04T14:29:45Z', clientId: 'client-a', sourceType: 'auth', severity: 'info', message: 'Successful login: administrator@airbus.com from 10.12.1.5 (workstation WRK-ADM-01)', sourceIp: '10.12.1.5', destIp: '10.12.0.1', username: 'administrator', host: 'AD-CORP-01', eventId: '4624' },
  { id: 'LOG-012', timestamp: '2026-03-04T14:29:30Z', clientId: 'client-b', sourceType: 'waf', severity: 'medium', message: "WAF alert: XSS attempt in parameter 'q' on /search endpoint", sourceIp: '185.47.23.11', destIp: '172.16.8.12', username: '', host: 'WAF-EXT-01', eventId: 'WAF-2001' },
  { id: 'LOG-013', timestamp: '2026-03-04T14:29:00Z', clientId: 'client-c', sourceType: 'firewall', severity: 'info', message: 'ALLOW inbound HTTPS 0.0.0.0:0 -> 192.168.4.100:443 (Web Server)', sourceIp: '82.45.112.33', destIp: '192.168.4.100', username: '', host: 'FW-PERIMETER', eventId: 'FW-1001' },
  { id: 'LOG-014', timestamp: '2026-03-04T14:28:30Z', clientId: 'client-d', sourceType: 'email', severity: 'high', message: 'Phishing email quarantined: From: ceo-noreply@orange-secure.net Subject: URGENT: Wire transfer required', sourceIp: '104.47.18.200', destIp: '172.20.1.1', username: 'cfo@orange.fr', host: 'MAIL-GW-01', eventId: 'EMAIL-4001' },
  { id: 'LOG-015', timestamp: '2026-03-04T14:28:00Z', clientId: 'client-e', sourceType: 'endpoint', severity: 'high', message: 'Lateral movement: NTLM authentication from 10.80.1.33 to 10.80.1.45 using stolen hash', sourceIp: '10.80.1.33', destIp: '10.80.1.45', username: 'svc_backup', host: 'OT-SRV-02', eventId: 'EDR-5001' },
  { id: 'LOG-016', timestamp: '2026-03-04T14:27:30Z', clientId: 'client-a', sourceType: 'endpoint', severity: 'critical', message: 'Mimikatz detected: sekurlsa::logonpasswords executed by user msmith on WRK-ENG-042', sourceIp: '10.12.5.42', destIp: '', username: 'msmith', host: 'WRK-ENG-042', eventId: 'EDR-6001' },
  { id: 'LOG-017', timestamp: '2026-03-04T14:27:00Z', clientId: 'client-b', sourceType: 'firewall', severity: 'critical', message: 'DDoS: 8.4 Gbps UDP flood detected targeting 89.234.157.254. Activating scrubbing center.', sourceIp: '0.0.0.0', destIp: '89.234.157.254', username: '', host: 'FW-SCRUBBING-01', eventId: 'FW-DDOS-001' },
  { id: 'LOG-018', timestamp: '2026-03-04T14:26:30Z', clientId: 'client-c', sourceType: 'auth', severity: 'medium', message: 'Privilege escalation: user fdubois executed sudo /bin/bash on linux-srv-04 outside maintenance window', sourceIp: '192.168.4.15', destIp: '', username: 'fdubois', host: 'LINUX-SRV-04', eventId: 'SUDO-001' },
  { id: 'LOG-019', timestamp: '2026-03-04T14:26:00Z', clientId: 'client-d', sourceType: 'cloud', severity: 'info', message: 'AWS CloudTrail: S3 bucket policy modified by arn:aws:iam::123456789:user/devops-pipeline', sourceIp: '10.50.1.100', destIp: 's3.amazonaws.com', username: 'devops-pipeline', host: 'AWS-PROD', eventId: 'AWS-S3-001' },
  { id: 'LOG-020', timestamp: '2026-03-04T14:25:30Z', clientId: 'client-e', sourceType: 'ids', severity: 'high', message: 'IDS Alert: ET MALWARE Observed Cobalt Strike Beacon User-Agent (CobaltStrike)', sourceIp: '10.80.3.67', destIp: '198.51.100.23', username: '', host: 'IDS-OT-01', eventId: 'SID-2019714' },
];

export const IOCS: IOC[] = [
  { id: 'IOC-001', type: 'ip', value: '185.220.101.47', threat: 'Tor Exit Node / Brute Force', confidence: 95, lastSeen: '2026-03-04T14:32:00Z', source: 'AbuseIPDB', tags: ['tor', 'brute-force', 'scanner'] },
  { id: 'IOC-002', type: 'ip', value: '198.51.100.23', threat: 'Cobalt Strike C2 Server', confidence: 98, lastSeen: '2026-03-04T11:20:00Z', source: 'ThreatFox', tags: ['c2', 'cobalt-strike', 'apt'] },
  { id: 'IOC-003', type: 'domain', value: 'xkqjhbvmnop.xyz', threat: 'DGA Malware C2 Domain', confidence: 87, lastSeen: '2026-03-04T14:30:00Z', source: 'DomainTools', tags: ['dga', 'malware', 'c2'] },
  { id: 'IOC-004', type: 'hash', value: 'a94c4e2a...f7b3d9e1', threat: 'Mimikatz variant', confidence: 99, lastSeen: '2026-03-04T13:44:00Z', source: 'VirusTotal', tags: ['credential-dumping', 'mimikatz', 'apt'] },
  { id: 'IOC-005', type: 'ip', value: '45.33.32.156', threat: 'Data Exfiltration Server', confidence: 78, lastSeen: '2026-03-04T13:55:00Z', source: 'Internal', tags: ['exfiltration', 'c2'] },
  { id: 'IOC-006', type: 'domain', value: 'orange-secure.net', threat: 'Phishing Domain', confidence: 92, lastSeen: '2026-03-04T14:28:00Z', source: 'PhishTank', tags: ['phishing', 'impersonation'] },
  { id: 'IOC-007', type: 'ip', value: '91.108.4.234', threat: 'Web Application Scanner', confidence: 82, lastSeen: '2026-03-04T14:28:00Z', source: 'Shodan', tags: ['scanner', 'sqli', 'bot'] },
  { id: 'IOC-008', type: 'hash', value: '3b4c7f9a...d2e1a5c8', threat: 'LockBit 3.0 Ransomware', confidence: 99, lastSeen: '2026-03-04T14:15:00Z', source: 'VirusTotal', tags: ['ransomware', 'lockbit', 'critical'] },
];

export const ALERT_TREND_DATA = [
  { date: 'Feb 27', critical: 8, high: 22, medium: 45, low: 78 },
  { date: 'Feb 28', critical: 5, high: 18, medium: 38, low: 65 },
  { date: 'Mar 01', critical: 12, high: 31, medium: 52, low: 89 },
  { date: 'Mar 02', critical: 7, high: 24, medium: 41, low: 71 },
  { date: 'Mar 03', critical: 14, high: 35, medium: 60, low: 94 },
  { date: 'Mar 04', critical: 18, high: 42, medium: 67, low: 103 },
  { date: 'Now',    critical: 6,  high: 15, medium: 28, low: 41 },
];

export const SOURCE_DISTRIBUTION = [
  { name: 'Firewall', value: 32, color: '#1AABBA' },
  { name: 'Endpoint', value: 28, color: '#CB5229' },
  { name: 'Auth',     value: 18, color: '#F0BC2C' },
  { name: 'IDS/IPS',  value: 10, color: '#2563EB' },
  { name: 'WAF',      value: 7,  color: '#E07820' },
  { name: 'Email',    value: 3,  color: '#10B981' },
  { name: 'Cloud',    value: 2,  color: '#8B5CF6' },
];

export const CLIENT_ALERT_COUNTS = [
  { client: 'Airbus',     critical: 3, high: 7, medium: 8, low: 5, color: '#1AABBA' },
  { client: 'BNP',        critical: 5, high: 12, medium: 15, low: 9, color: '#CB5229' },
  { client: 'Crédit Ag.', critical: 2, high: 3, medium: 1, low: 1, color: '#C8980E' },
  { client: 'Orange',     critical: 1, high: 4, medium: 5, low: 2, color: '#E07820' },
  { client: 'Total',      critical: 2, high: 5, medium: 8, low: 3, color: '#2563EB' },
];

export const STATS = {
  totalAlertsToday: 230,
  criticalAlerts: 13,
  openIncidents: 5,
  avgMTTR: '42 min',
  clientsMonitored: 5,
  eventsPerSecond: 1842,
  falsePositiveRate: '12%',
  resolvedToday: 34,
};
