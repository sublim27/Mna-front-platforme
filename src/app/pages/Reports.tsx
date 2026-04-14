import { useState } from 'react';
import { BarChart2, Download, Plus, Clock, CheckCircle, FileText, Calendar, ChevronRight } from 'lucide-react';
import { CLIENTS } from '../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Separator } from '../components/ui/separator';

const REPORT_TEMPLATES = [
  { id: 'exec-summary',      name: 'Executive Summary',        desc: 'High-level security posture for management',  icon: '📊', freq: 'Weekly',  color: '#1AABBA' },
  { id: 'incident-report',   name: 'Incident Report',          desc: 'Detailed analysis with timeline and impact',  icon: '🚨', freq: 'Ad-hoc',  color: '#CB5229' },
  { id: 'threat-digest',     name: 'Threat Intel Digest',      desc: 'IOC summary, CVE watch, threat actor updates',icon: '🛡️', freq: 'Daily',   color: '#F0BC2C' },
  { id: 'soc2-compliance',   name: 'SOC 2 Compliance Report',  desc: 'Audit log and control effectiveness',         icon: '✅', freq: 'Monthly', color: '#10B981' },
  { id: 'client-monthly',    name: 'Client Monthly Review',    desc: 'Per-client alert/incident KPIs',              icon: '📋', freq: 'Monthly', color: '#2563EB' },
  { id: 'vuln-assessment',   name: 'Vulnerability Assessment', desc: 'Open CVEs, patch status and remediation',     icon: '🔍', freq: 'Weekly',  color: '#8B5CF6' },
];

const GENERATED_REPORTS = [
  { id: 'RPT-024', name: 'Executive Summary — Week 9, 2026',     template: 'Executive Summary',      client: 'All Clients',   status: 'ready',      size: '1.2 MB', generatedAt: '2026-03-04T08:00:00Z' },
  { id: 'RPT-023', name: 'INC-001 — APT Campaign Incident Report',template: 'Incident Report',        client: 'BNP Paribas',   status: 'ready',      size: '842 KB', generatedAt: '2026-03-04T06:30:00Z' },
  { id: 'RPT-022', name: 'Threat Intelligence Digest — Mar 4',   template: 'Threat Intel Digest',    client: 'All Clients',   status: 'ready',      size: '540 KB', generatedAt: '2026-03-04T06:00:00Z' },
  { id: 'RPT-021', name: 'Airbus Group — Monthly Review Feb 2026',template: 'Client Monthly Review',  client: 'Airbus Group',  status: 'ready',      size: '2.1 MB', generatedAt: '2026-03-01T09:00:00Z' },
  { id: 'RPT-020', name: 'SOC 2 Compliance — Q4 2025',           template: 'SOC 2 Compliance',       client: 'All Clients',   status: 'ready',      size: '5.7 MB', generatedAt: '2026-01-15T10:00:00Z' },
  { id: 'RPT-019', name: 'Vulnerability Assessment — Week 8',     template: 'Vulnerability Assessment',client: 'All Clients',   status: 'generating', size: '—',      generatedAt: '2026-03-04T14:30:00Z' },
];

const METRICS = [
  { label: 'Reports Generated (MTD)', value: '24',     icon: FileText,    color: '#1AABBA' },
  { label: 'Avg Generation Time',     value: '2.3 min', icon: Clock,       color: '#F0BC2C' },
  { label: 'Scheduled Reports',       value: '8',       icon: Calendar,    color: '#CB5229' },
  { label: 'Ready to Download',       value: '23',      icon: CheckCircle, color: '#10B981' },
];

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0)  return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

export default function Reports() {
  const [showModal,       setShowModal]       = useState(false);
  const [selectedTpl,    setSelectedTpl]     = useState('');
  const [selectedClient, setSelectedClient]  = useState('all');
  const [dateRange,      setDateRange]       = useState('last-7');

  const clients = Object.values(CLIENTS);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} style={{ color: '#1AABBA' }} />
          <h1 style={{ color: '#0F172A', fontSize: 18, fontWeight: 700, margin: 0 }}>Reports</h1>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={14} /> Generate Report
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-xl"
                    style={{ width: 42, height: 42, backgroundColor: `${m.color}18`, border: `1px solid ${m.color}35` }}>
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                  <div>
                    <p style={{ color: '#0F172A', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{m.value}</p>
                    <p style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>{m.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Templates */}
      <div>
        <h2 style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Report Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map(tpl => (
            <Card
              key={tpl.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
              onClick={() => { setSelectedTpl(tpl.id); setShowModal(true); }}
              style={{ borderLeft: `3px solid ${tpl.color}` }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3">
                  <span style={{ fontSize: 26 }}>{tpl.icon}</span>
                  <div>
                    <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, margin: 0 }}>{tpl.name}</p>
                    <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{tpl.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${tpl.color}18`, color: tpl.color }}>
                    {tpl.freq}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#1AABBA' }}>
                    Generate <ChevronRight size={12} />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 style={{ color: '#0F172A', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Recent Reports</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 80 }}>ID</TableHead>
                <TableHead>Report Name</TableHead>
                <TableHead style={{ width: 170 }}>Template</TableHead>
                <TableHead style={{ width: 130 }}>Client</TableHead>
                <TableHead style={{ width: 110 }}>Status</TableHead>
                <TableHead style={{ width: 70 }}>Size</TableHead>
                <TableHead style={{ width: 80 }}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GENERATED_REPORTS.map(rpt => (
                <TableRow key={rpt.id}>
                  <TableCell style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: 11 }}>{rpt.id}</TableCell>
                  <TableCell>
                    <p style={{ color: '#334155', fontSize: 12, fontWeight: 500, margin: 0 }}>{rpt.name}</p>
                    <p style={{ color: '#CBD5E1', fontSize: 10, margin: 0 }}>{timeSince(rpt.generatedAt)}</p>
                  </TableCell>
                  <TableCell style={{ color: '#64748B', fontSize: 12 }}>{rpt.template}</TableCell>
                  <TableCell>
                    {rpt.client === 'All Clients' ? (
                      <span style={{ color: '#94A3B8', fontSize: 12 }}>All Clients</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: Object.values(CLIENTS).find(c => c.name === rpt.client)?.color ?? '#94A3B8' }} />
                        <span style={{ color: '#64748B', fontSize: 12 }}>{rpt.client}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {rpt.status === 'ready' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#10B981' }}>
                        <CheckCircle size={12} /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#C8980E' }}>
                        <Clock size={12} /> Generating
                      </span>
                    )}
                  </TableCell>
                  <TableCell style={{ color: '#94A3B8', fontSize: 12 }}>{rpt.size}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={rpt.status !== 'ready'}
                      style={{ color: rpt.status === 'ready' ? '#1AABBA' : '#CBD5E1' }}
                    >
                      <Download size={13} /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Generate Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>Configure the report parameters below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Report Template
              </label>
              <select
                value={selectedTpl}
                onChange={e => setSelectedTpl(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="">Select template…</option>
                {REPORT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Client Scope
              </label>
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="all">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="last-24h">Last 24 hours</option>
                <option value="last-7">Last 7 days</option>
                <option value="last-30">Last 30 days</option>
                <option value="last-90">Last 90 days</option>
              </select>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => setShowModal(false)}>Generate Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}