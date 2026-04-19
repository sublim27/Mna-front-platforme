import { useOutletContext } from 'react-router';
import type { ComponentType, CSSProperties } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Shield, Clock, Activity, Zap, Users,
  ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import { SEVERITY_CONFIG } from '../config/siem-config';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { PageHero, PageShell } from '../components/layout/page-shell';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { useDashboardData } from '../features/dashboard/useDashboardData';

type StatCardProps = {
  icon: ComponentType<{ size?: number; style?: CSSProperties; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: 'up' | 'down';
  pulse?: boolean;
};

type ChartTooltipEntry = {
  dataKey: string;
  color: string;
  name: string;
  value: string | number;
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function SevBadge({ severity }: { severity: keyof typeof SEVERITY_CONFIG }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  new: { color: '#CB5229', bg: '#FBF0EC' },
  investigating: { color: '#1AABBA', bg: '#E6F7F9' },
  resolved: { color: '#10B981', bg: '#ECFDF5' },
  false_positive: { color: '#64748B', bg: '#F1F5F9' },
  open: { color: '#CB5229', bg: '#FBF0EC' },
  contained: { color: '#F0BC2C', bg: '#FEF7E0' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { color: '#64748B', bg: '#F1F5F9' };
  const label = status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, trend, pulse }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          {pulse ? (
            <span className="relative flex h-2.5 w-2.5 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
            </span>
          ) : null}
        </div>
        <p style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ color: '#0F172A', fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
        {sub ? (
          <p className="flex items-center gap-1 mt-1" style={{ color: '#94A3B8', fontSize: 11 }}>
            {trend === 'up' ? <TrendingUp size={11} style={{ color: '#CB5229' }} /> : null}
            {trend === 'down' ? <TrendingDown size={11} style={{ color: '#10B981' }} /> : null}
            {sub}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl shadow-lg p-3 bg-white" style={{ border: '1px solid #E2E8F0', minWidth: 140 }}>
      <p className="mb-1.5" style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#475569', fontSize: 11 }}>{entry.name}: <strong style={{ color: '#0F172A' }}>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { selectedClient } = useOutletContext<{ selectedClient: string; timeRange: string }>();
  const {
    loading,
    error,
    clientsById,
    recentAlerts,
    openIncidents,
    alertTrendData,
    sourceDistribution,
    clientAlertCounts,
    stats,
  } = useDashboardData(selectedClient);

  if (loading) {
    return (
      <PageShell className="max-w-7xl">
        <PageHero title="SOC Command Center" subtitle="Loading real-time dashboard data from backend..." />
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell className="max-w-7xl">
        <PageHero title="SOC Command Center" subtitle="Unable to load backend data for this view." />
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle size={28} className="mx-auto mb-3 text-coral" />
            <p style={{ color: '#64748B', fontSize: 14 }}>{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-3">Retry</Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-7xl">
      <PageHero
        title="SOC Command Center"
        subtitle="Unified operational view for alerts, incidents, and client health."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard icon={AlertTriangle} label="Total Alerts" value={stats.totalAlertsToday} sub="From backend data" color="#CB5229" />
        <StatCard icon={Zap} label="Critical" value={stats.criticalAlerts} sub="Immediate action required" color="#CB5229" pulse />
        <StatCard icon={Shield} label="Open Incidents" value={stats.openIncidents} sub="Active investigations" color="#F0BC2C" />
        <StatCard icon={Clock} label="Avg MTTR" value={stats.avgMTTR} sub="Resolved incident average" color="#10B981" />
        <StatCard icon={Activity} label="Events / sec" value={stats.eventsPerSecond.toLocaleString()} sub="Based on live alerts" color="#1AABBA" pulse />
        <StatCard icon={Users} label="Clients" value={stats.clientsMonitored} sub="Monitoring scope" color="#2563EB" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle>Alert Trend - Last 7 Days</CardTitle>
                <CardDescription>By severity level</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ l: 'Critical', c: '#CB5229' }, { l: 'High', c: '#C8980E' }, { l: 'Medium', c: '#1AABBA' }, { l: 'Low', c: '#94A3B8' }].map((sev) => (
                  <div key={sev.l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sev.c }} />
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{sev.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={alertTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {[{ id: 'critical', c: '#CB5229' }, { id: 'high', c: '#C8980E' }, { id: 'medium', c: '#1AABBA' }, { id: 'low', c: '#94A3B8' }].map((grad) => (
                    <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={grad.c} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={grad.c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#CB5229" fill="url(#critical)" strokeWidth={2} />
                <Area type="monotone" dataKey="high" name="High" stroke="#C8980E" fill="url(#high)" strokeWidth={2} />
                <Area type="monotone" dataKey="medium" name="Medium" stroke="#1AABBA" fill="url(#medium)" strokeWidth={2} />
                <Area type="monotone" dataKey="low" name="Low" stroke="#94A3B8" fill="url(#low)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Event Sources</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={44} outerRadius={66} dataKey="value" paddingAngle={3}>
                  {sourceDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, '']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {sourceDistribution.slice(0, 5).map((source) => (
                <div key={source.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                  <span style={{ color: '#64748B', fontSize: 11, flex: 1 }}>{source.name}</span>
                  <span style={{ color: '#0F172A', fontSize: 11, fontWeight: 600 }}>{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Alerts by Client &amp; Severity</CardTitle>
            <CardDescription>Current open alerts breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={clientAlertCounts} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="client" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill="#CB5229" />
                <Bar dataKey="high" name="High" stackId="a" fill="#C8980E" />
                <Bar dataKey="medium" name="Medium" stackId="a" fill="#1AABBA" />
                <Bar dataKey="low" name="Low" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Client Health</CardTitle>
            <CardDescription>Real-time monitoring status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(clientsById).map((client) => (
              <div key={client.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center rounded-md text-white shrink-0"
                      style={{ width: 24, height: 24, backgroundColor: client.color, fontSize: 9, fontWeight: 700 }}
                    >
                      {client.initials}
                    </div>
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{client.shortName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor:
                          client.status === 'healthy' ? '#10B981' :
                            client.status === 'warning' ? '#F0BC2C' : '#CB5229',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color:
                          client.status === 'healthy' ? '#10B981' :
                            client.status === 'warning' ? '#C8980E' : '#CB5229',
                      }}
                    >
                      {client.status}
                    </span>
                  </div>
                </div>
                <Progress value={Math.min(100, (client.openAlerts / 50) * 100)} indicatorClassName={undefined} style={{ height: 5 }} />
                <p style={{ color: '#CBD5E1', fontSize: 10, marginTop: 3 }}>{client.openAlerts} open alerts</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Alerts</CardTitle>
              <a href="/alerts" className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70" style={{ color: '#1AABBA' }}>
                View all <ChevronRight size={12} />
              </a>
            </div>
          </CardHeader>
          <div className="mt-3">
            <div className="grid px-5 py-2 bg-slate-50" style={{ gridTemplateColumns: '1fr 80px 90px 60px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
              {['Alert', 'Severity', 'Client', 'Time'].map((header) => (
                <span key={header} style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{header}</span>
              ))}
            </div>
            {recentAlerts.map((alert, index) => {
              const client = clientsById[alert.clientId] ?? {
                color: '#94A3B8',
                shortName: alert.clientId,
              };

              return (
                <div
                  key={alert.id}
                  className="grid px-5 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  style={{
                    gridTemplateColumns: '1fr 80px 90px 60px',
                    borderBottom: index < recentAlerts.length - 1 ? '1px solid #F8FAFC' : 'none',
                    borderLeft: `3px solid ${client.color}`,
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <p style={{ color: '#334155', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</p>
                    <p style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}>{alert.rule}</p>
                  </div>
                  <div className="flex items-center"><SevBadge severity={alert.severity} /></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
                    <span style={{ color: client.color, fontSize: 11, fontWeight: 500 }}>{client.shortName}</span>
                  </div>
                  <div className="flex items-center">
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{formatTime(alert.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Open Incidents</CardTitle>
              <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: '#FBF0EC', color: '#CB5229', minWidth: 24 }}>
                {openIncidents.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {openIncidents.slice(0, 6).map((incident) => {
              const client = clientsById[incident.clientId] ?? {
                color: '#94A3B8',
                shortName: incident.clientId,
              };
              const sev = SEVERITY_CONFIG[incident.severity];

              return (
                <div key={incident.id} className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm" style={{ backgroundColor: '#FAFAFA', border: '1px solid #F1F5F9', borderLeft: `3px solid ${sev.color}` }}>
                  <p style={{ color: '#334155', fontSize: 12, fontWeight: 500, lineHeight: 1.35, marginBottom: 6 }}>{incident.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                      <span style={{ color: '#64748B', fontSize: 10 }}>{client.shortName}</span>
                    </div>
                    <SevBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                    <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: 10 }}>{timeSince(incident.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
