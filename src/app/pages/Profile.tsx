import { useState, useEffect } from 'react';
import {
  Mail,
  Shield,
  Clock,
  Save,
  Bell,
  Lock,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  BarChart3,
  CheckCheck,
  Gauge,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { authClient } from '../features/auth/auth-client';
import { PageShell } from '../components/layout/page-shell';
import { API_BASE_URL } from '../config/api';

const ROLE_COLORS: Record<string, { bg: string; color: string; accent: string }> = {
  'SOC Analyst L2': { bg: '#E6F7F9', color: '#1AABBA', accent: '#1AABBA' },
  'SOC Analyst L1': { bg: '#FEF7E0', color: '#C8980E', accent: '#C8980E' },
  'SOC Lead': { bg: '#FBF0EC', color: '#CB5229', accent: '#CB5229' },
  CISO: { bg: '#F0F4FF', color: '#2563EB', accent: '#2563EB' },
};

const ACTIVITY = [
  { id: 1, action: 'Resolved alert ALT-019 - Web Shell Upload', time: '14:22', color: '#10B981' },
  { id: 2, action: 'Escalated incident INC-003 to L3', time: '13:47', color: '#CB5229' },
  { id: 3, action: 'Generated Executive Summary report', time: '11:30', color: '#1AABBA' },
  { id: 4, action: 'Updated IOC feed - 3 new indicators added', time: '10:15', color: '#F0BC2C' },
  { id: 5, action: 'Assigned alert ALT-010 to C. Martin', time: '09:55', color: '#1AABBA' },
  { id: 6, action: 'Closed incident INC-008 - Phishing Campaign', time: 'Yesterday', color: '#10B981' },
];

export default function Profile() {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('SOC Analyst L2');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const [notif, setNotif] = useState({
    emailCritical: true,
    emailIncident: true,
    emailReports: false,
    browserAlerts: true,
    weeklyDigest: true,
    mfaEnabled: true,
  });

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
  }, [user]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const initials = user?.name ? getInitials(user.name) : '?';
  const role = ROLE_COLORS[title] ?? { bg: '#E6F7F9', color: '#1AABBA', accent: '#1AABBA' };

  const pwMatch = newPw && confirmPw && newPw === confirmPw;
  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : 3;
  const pwStrengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', '#CB5229', '#F0BC2C', '#10B981'][pwStrength];

  const handleSaveName = async () => {
    setNameLoading(true);
    setNameError('');
    setNameSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setNameError(err.message ?? 'Failed to update');
      } else {
        setNameSuccess('Profile updated successfully.');
        refetch();
        setTimeout(() => setNameSuccess(''), 3000);
      }
    } catch {
      setNameError('Network error');
    }

    setNameLoading(false);
  };

  const handleUpdatePassword = async () => {
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPwError(err.message ?? 'Failed to update password');
      } else {
        setPwSuccess('Password updated successfully.');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setTimeout(() => setPwSuccess(''), 3000);
      }
    } catch {
      setPwError('Network error');
    }

    setPwLoading(false);
  };

  return (
    <PageShell className="max-w-6xl space-y-5">
      <Card className="overflow-hidden" style={{ borderColor: '#DCEAF0' }}>
        <div
          className="px-5 md:px-7 py-6 md:py-7"
          style={{
            background:
              'radial-gradient(140% 120% at 0% 0%, #E6F7F9 0%, #F8FAFC 45%, #FFFFFF 100%)',
          }}
        >
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                  style={{ boxShadow: `0 8px 24px ${role.accent}33` }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white select-none"
                  style={{
                    background: `linear-gradient(135deg, ${role.accent}, #0F172A)`,
                    fontSize: 30,
                    fontWeight: 800,
                    boxShadow: `0 8px 24px ${role.accent}33`,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 style={{ color: '#0F172A', margin: 0, fontSize: 30, lineHeight: 1.1 }} className="truncate">
                    {user?.name ?? 'Loading...'}
                  </h1>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: role.bg, color: role.color }}
                  >
                    {title}
                  </span>
                </div>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                  {user?.email}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#10B981' }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#10B981' }} />
                  </span>
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>Session Active</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
              {[
                { label: 'Alerts', value: '1,247', icon: BarChart3, color: '#1AABBA' },
                { label: 'Closed', value: '83', icon: CheckCheck, color: '#10B981' },
                { label: 'MTTR', value: '38m', icon: Gauge, color: '#F0BC2C' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl px-3 py-3"
                    style={{ backgroundColor: '#FFFFFFCC', border: '1px solid #E2E8F0' }}
                  >
                    <Icon size={14} style={{ color: item.color }} />
                    <p style={{ color: '#0F172A', fontSize: 19, fontWeight: 800, margin: '6px 0 2px' }}>{item.value}</p>
                    <p style={{ color: '#94A3B8', fontSize: 10, margin: 0 }}>{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-slate-100/90">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile identity and SOC role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input id="email" value={user?.email ?? ''} disabled className="pl-8 opacity-70 cursor-not-allowed" />
                </div>
                <p className="text-xs text-slate-400">Email is managed by your authentication provider.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title</Label>
                <div className="relative">
                  <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
                  >
                    {['SOC Analyst L1', 'SOC Analyst L2', 'SOC Lead', 'CISO'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {nameError && <p className="text-sm" style={{ color: '#CB5229' }}>{nameError}</p>}
              {nameSuccess && <p className="text-sm" style={{ color: '#10B981' }}>{nameSuccess}</p>}

              <div className="flex justify-end">
                <Button onClick={handleSaveName} disabled={nameLoading} style={{ backgroundColor: '#1AABBA', color: '#fff' }}>
                  {nameLoading ? <><Save size={14} /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Password & Access</CardTitle>
              <CardDescription>Keep your SOC account protected with a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="********"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="********"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {newPw && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ backgroundColor: i <= pwStrength ? pwStrengthColor : '#E2E8F0' }} />
                      ))}
                    </div>
                    <p style={{ color: pwStrengthColor || '#94A3B8', fontSize: 11 }}>{pwStrengthLabel || 'Enter a new password'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="********"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {confirmPw && !pwMatch && (
                  <p className="flex items-center gap-1" style={{ color: '#CB5229', fontSize: 11 }}>
                    <AlertTriangle size={11} /> Passwords do not match
                  </p>
                )}
                {pwMatch && (
                  <p className="flex items-center gap-1" style={{ color: '#10B981', fontSize: 11 }}>
                    <CheckCircle2 size={11} /> Passwords match
                  </p>
                )}
              </div>

              {pwError && <p className="text-sm" style={{ color: '#CB5229' }}>{pwError}</p>}
              {pwSuccess && <p className="text-sm" style={{ color: '#10B981' }}>{pwSuccess}</p>}

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={!currentPw || !pwMatch || pwLoading}
                  style={{ backgroundColor: '#1AABBA', color: '#fff', opacity: !currentPw || !pwMatch ? 0.55 : 1 }}
                >
                  <Lock size={14} /> {pwLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what signals you get from the SOC platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { key: 'emailCritical', label: 'Email - Critical Alerts', desc: 'Immediate email for critical severity alerts', icon: Bell, color: '#CB5229' },
                { key: 'emailIncident', label: 'Email - Incident Updates', desc: 'Notify when incidents are created or updated', icon: Bell, color: '#F0BC2C' },
                { key: 'emailReports', label: 'Email - Report Ready', desc: 'Email when a scheduled report is generated', icon: Bell, color: '#1AABBA' },
                { key: 'browserAlerts', label: 'Browser Push Notifications', desc: 'Real-time browser alerts for high severity events', icon: Activity, color: '#1AABBA' },
                { key: 'weeklyDigest', label: 'Weekly Security Digest', desc: 'Summary of KPIs, alerts, and incidents every Monday', icon: Clock, color: '#10B981' },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                const val = notif[item.key as keyof typeof notif] as boolean;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between py-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: `${item.color}18`, border: `1px solid ${item.color}35` }}>
                          <Icon size={16} style={{ color: item.color }} />
                        </div>
                        <div className="min-w-0">
                          <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, margin: 0 }} className="truncate">{item.label}</p>
                          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                      <Switch checked={val} onCheckedChange={(v) => setNotif((n) => ({ ...n, [item.key]: v }))} />
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions inside the SOC platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: '#E2E8F0' }} />
                <div className="space-y-5">
                  {ACTIVITY.map((a) => (
                    <div key={a.id} className="relative">
                      <div className="absolute -left-[18px] w-3 h-3 rounded-full border-2 border-white mt-0.5" style={{ backgroundColor: a.color }} />
                      <p style={{ color: '#334155', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{a.action}</p>
                      <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{a.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
