import { useState } from 'react';
import { Shield, Globe, Hash, Link, Search, AlertTriangle } from 'lucide-react';
import { IOCS, type IOC } from '../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';

const THREAT_FEEDS = [
  { name: 'MISP Platform',       type: 'Internal',   events: 1847,   lastSync: '2 min ago',  status: 'active',   color: '#1AABBA' },
  { name: 'VirusTotal',          type: 'Commercial', events: 892340, lastSync: '5 min ago',  status: 'active',   color: '#10B981' },
  { name: 'AbuseIPDB',           type: 'Community',  events: 428192, lastSync: '10 min ago', status: 'active',   color: '#F0BC2C' },
  { name: 'ThreatFox (Abuse.ch)',type: 'Community',  events: 78432,  lastSync: '15 min ago', status: 'active',   color: '#CB5229' },
  { name: 'DomainTools Iris',    type: 'Commercial', events: 125000, lastSync: '1 min ago',  status: 'active',   color: '#2563EB' },
  { name: 'PhishTank',           type: 'Community',  events: 34820,  lastSync: '30 min ago', status: 'degraded', color: '#E07820' },
  { name: 'CIRCL CVE Search',    type: 'Public',     events: 228491, lastSync: '1 hr ago',   status: 'active',   color: '#8B5CF6' },
];

const CVE_FEED = [
  { id: 'CVE-2025-21333', score: 9.8, severity: 'Critical', product: 'Windows Hyper-V',    vendor: 'Microsoft',    description: 'Heap-based buffer overflow allowing privilege escalation in Hyper-V.',          published: '2025-03-01', exploited: true },
  { id: 'CVE-2026-1234',  score: 8.6, severity: 'High',     product: 'Palo Alto PAN-OS',  vendor: 'Palo Alto',    description: 'Authentication bypass in GlobalProtect VPN gateway.',                        published: '2026-02-28', exploited: false },
  { id: 'CVE-2026-5678',  score: 7.5, severity: 'High',     product: 'VMware vCenter',    vendor: 'Broadcom',     description: 'Remote code execution via SOAP API in vCenter Server 8.x.',                 published: '2026-02-25', exploited: true },
  { id: 'CVE-2025-48791', score: 6.8, severity: 'Medium',   product: 'OpenSSL',           vendor: 'OpenSSL',      description: 'Use-after-free in X.509 certificate processing.',                          published: '2026-02-20', exploited: false },
  { id: 'CVE-2026-0099',  score: 5.3, severity: 'Medium',   product: 'Apache HTTP Server',vendor: 'Apache',       description: 'SSRF via mod_proxy in Apache 2.4.x.',                                      published: '2026-02-15', exploited: false },
];

const THREAT_ACTORS = [
  { name: 'APT28 (Fancy Bear)',  origin: 'Russia',      targets: ['Government','Defense','Aerospace'],  techniques: ['Spear Phishing','C2','Credential Theft'],   activity: 'High',   color: '#CB5229' },
  { name: 'Lazarus Group',       origin: 'North Korea', targets: ['Financial','Crypto','Defense'],       techniques: ['Supply Chain','Watering Hole','Ransomware'], activity: 'High',   color: '#F0BC2C' },
  { name: 'Sandworm',            origin: 'Russia',      targets: ['Energy','Industrial','Government'],   techniques: ['ICS Attack','Wiper Malware','VPN Exploit'],  activity: 'Medium', color: '#1AABBA' },
  { name: 'FIN7',                origin: 'Unknown',     targets: ['Retail','Hospitality','Financial'],   techniques: ['Phishing','JS Implant','POS Malware'],       activity: 'Low',    color: '#2563EB' },
];

const IOC_ICONS: Record<IOC['type'], typeof Globe> = { ip: Globe, domain: Link, hash: Hash, url: Link };

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#CB5229' : value >= 70 ? '#C8980E' : '#1AABBA';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 600, minWidth: 32 }}>{value}%</span>
    </div>
  );
}

function CvssScore({ score }: { score: number }) {
  const color = score >= 9 ? '#CB5229' : score >= 7 ? '#C8980E' : score >= 4 ? '#1AABBA' : '#64748B';
  const bg    = score >= 9 ? '#FBF0EC' : score >= 7 ? '#FEF7E0' : score >= 4 ? '#E6F7F9' : '#F1F5F9';
  return (
    <div className="flex flex-col items-center justify-center rounded-xl p-2" style={{ backgroundColor: bg, minWidth: 56 }}>
      <span style={{ color, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{score}</span>
      <span style={{ color, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>CVSS</span>
    </div>
  );
}

export default function ThreatIntel() {
  const [search, setSearch] = useState('');

  const filteredIOCs = IOCS.filter(ioc =>
    !search || ioc.value.toLowerCase().includes(search.toLowerCase()) || ioc.threat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Shield size={20} style={{ color: '#1AABBA' }} />
        <h1 style={{ color: '#0F172A', fontSize: 18, fontWeight: 700, margin: 0 }}>Threat Intelligence</h1>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}>
          {IOCS.length} active IOCs
        </span>
      </div>

      {/* Feed Status Strip */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-5 overflow-x-auto">
            <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Feed Status</span>
            <div className="w-px h-4 bg-slate-200 shrink-0" />
            {THREAT_FEEDS.map(feed => (
              <div key={feed.name} className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ backgroundColor: feed.status === 'active' ? '#10B981' : '#F0BC2C' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: feed.status === 'active' ? '#10B981' : '#F0BC2C' }} />
                </span>
                <span style={{ color: '#64748B', fontSize: 11 }}>{feed.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="ioc">
        <TabsList>
          <TabsTrigger value="ioc">IOC Feed <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-teal-light text-teal">{IOCS.length}</span></TabsTrigger>
          <TabsTrigger value="cve">CVE Watch <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gold-light text-gold-dark">{CVE_FEED.length}</span></TabsTrigger>
          <TabsTrigger value="actors">Threat Actors</TabsTrigger>
          <TabsTrigger value="feeds">Data Feeds <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200 text-slate-600">{THREAT_FEEDS.length}</span></TabsTrigger>
        </TabsList>

        {/* IOC */}
        <TabsContent value="ioc">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle>Indicators of Compromise</CardTitle>
                <div className="ml-auto relative w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IOCs…" className="pl-8 h-8 text-xs" />
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Type</TableHead><TableHead>Indicator</TableHead><TableHead>Threat</TableHead><TableHead>Confidence</TableHead><TableHead>Last Seen</TableHead><TableHead>Source</TableHead><TableHead>Tags</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filteredIOCs.map(ioc => {
                  const Icon = IOC_ICONS[ioc.type];
                  return (
                    <TableRow key={ioc.id}>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{ backgroundColor: '#E6F7F9', color: '#1AABBA' }}>
                          <Icon size={10} />{ioc.type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: '#1AABBA', fontFamily: 'monospace', fontSize: 12 }}>{ioc.value}</span>
                      </TableCell>
                      <TableCell style={{ color: '#475569', fontSize: 12 }}>{ioc.threat}</TableCell>
                      <TableCell style={{ minWidth: 120 }}><ConfidenceBar value={ioc.confidence} /></TableCell>
                      <TableCell style={{ color: '#94A3B8', fontSize: 11 }}>
                        {new Date(ioc.lastSeen).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell style={{ color: '#64748B', fontSize: 11 }}>{ioc.source}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ioc.tags.slice(0, 2).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-xs"
                              style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{t}</span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* CVE */}
        <TabsContent value="cve">
          <div className="space-y-3">
            {CVE_FEED.map(cve => {
              const color = cve.score >= 9 ? '#CB5229' : cve.score >= 7 ? '#C8980E' : '#1AABBA';
              return (
                <Card key={cve.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <CvssScore score={cve.score} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 700 }}>{cve.id}</span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={{ backgroundColor: `${color}18`, color }}>
                            {cve.severity}
                          </span>
                          {cve.exploited && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                              style={{ backgroundColor: '#FBF0EC', color: '#CB5229', border: '1px solid #CB522930' }}>
                              ⚡ EXPLOITED IN WILD
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#475569', fontSize: 13, marginBottom: 8 }}>{cve.description}</p>
                        <div className="flex gap-6">
                          <span style={{ color: '#94A3B8', fontSize: 11 }}>Product: <span style={{ color: '#1AABBA', fontWeight: 500 }}>{cve.product}</span></span>
                          <span style={{ color: '#94A3B8', fontSize: 11 }}>Vendor: <span style={{ color: '#475569' }}>{cve.vendor}</span></span>
                          <span style={{ color: '#94A3B8', fontSize: 11 }}>Published: <span style={{ color: '#475569' }}>{cve.published}</span></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Actors */}
        <TabsContent value="actors">
          <div className="grid grid-cols-2 gap-4">
            {THREAT_ACTORS.map(actor => {
              const activityColor = actor.activity === 'High' ? '#CB5229' : actor.activity === 'Medium' ? '#C8980E' : '#10B981';
              const activityBg    = actor.activity === 'High' ? '#FBF0EC' : actor.activity === 'Medium' ? '#FEF7E0' : '#ECFDF5';
              return (
                <Card key={actor.name} style={{ borderLeft: `4px solid ${actor.color}` }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: 0 }}>{actor.name}</h4>
                        <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>Origin: <span style={{ color: '#475569' }}>{actor.origin}</span></p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: activityBg, color: activityColor }}>
                        {actor.activity} Activity
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Targets</p>
                        <div className="flex flex-wrap gap-1">
                          {actor.targets.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-md text-xs"
                              style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Techniques</p>
                        <div className="flex flex-wrap gap-1">
                          {actor.techniques.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ backgroundColor: `${actor.color}15`, color: actor.color }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Feeds */}
        <TabsContent value="feeds">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feed Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead style={{ width: 140 }}>Indicators</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead style={{ width: 100 }}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {THREAT_FEEDS.map(feed => (
                  <TableRow key={feed.name}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: feed.color }} />
                        <span style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>{feed.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md text-xs"
                        style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{feed.type}</span>
                    </TableCell>
                    <TableCell style={{ color: '#475569', fontSize: 12 }}>{feed.events.toLocaleString()}</TableCell>
                    <TableCell style={{ color: '#94A3B8', fontSize: 12 }}>{feed.lastSync}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          {feed.status === 'active' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#10B981' }} />
                          )}
                          <span className="relative inline-flex rounded-full h-2 w-2"
                            style={{ backgroundColor: feed.status === 'active' ? '#10B981' : '#F0BC2C' }} />
                        </span>
                        <span style={{ color: feed.status === 'active' ? '#10B981' : '#C8980E', fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>
                          {feed.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}