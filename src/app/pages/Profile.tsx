import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building2, Shield, Clock, Save, Camera,
  Bell, Lock, Globe, CheckCircle2, Key, Eye, EyeOff, AlertTriangle, LogOut,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { authClient } from '../features/auth/auth-client';

const API = 'http://localhost:3000';

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  'SOC Analyst L2': { bg: '#E6F7F9', color: '#1AABBA' },
  'SOC Analyst L1': { bg: '#FEF7E0', color: '#C8980E' },
  'SOC Lead':       { bg: '#FBF0EC', color: '#CB5229' },
  'CISO':           { bg: '#F0F4FF', color: '#2563EB' },
};

const ACTIVITY = [
  { id: 1, action: 'Resolved alert ALT-019 — Web Shell Upload',  time: '14:22', color: '#10B981' },
  { id: 2, action: 'Escalated incident INC-003 to L3',            time: '13:47', color: '#CB5229' },
  { id: 3, action: 'Generated Executive Summary report',          time: '11:30', color: '#1AABBA' },
  { id: 4, action: 'Updated IOC feed — 3 new indicators added',   time: '10:15', color: '#F0BC2C' },
  { id: 5, action: 'Assigned alert ALT-010 to C. Martin',         time: '09:55', color: '#1AABBA' },
  { id: 6, action: 'Closed incident INC-008 — Phishing Campaign', time: 'Yesterday', color: '#10B981' },
];

export default function Profile() {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [title,     setTitle]     = useState('SOC Analyst L2');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError,   setNameError]   = useState('');

  // Password
  const [currentPw,   setCurrentPw]   = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwSuccess,   setPwSuccess]   = useState('');
  const [pwError,     setPwError]     = useState('');

  // Notifications
  const [notif, setNotif] = useState({
    emailCritical: true,
    emailIncident: true,
    emailReports:  false,
    browserAlerts: true,
    weeklyDigest:  true,
    mfaEnabled:    true,
  });

  // Load real user data on mount
  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
  }, [user]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const initials = user?.name ? getInitials(user.name) : '?';
  const role = ROLE_COLORS[title] ?? { bg: '#E6F7F9', color: '#1AABBA' };

  const pwMatch    = newPw && confirmPw && newPw === confirmPw;
  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : 3;
  const pwStrengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', '#CB5229', '#F0BC2C', '#10B981'][pwStrength];

  // Update name
  const handleSaveName = async () => {
    setNameLoading(true);
    setNameError('');
    setNameSuccess('');

    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setNameError(err.message ?? 'Failed to update');
      } else {
        setNameSuccess('Profile updated successfully!');
        refetch();
        setTimeout(() => setNameSuccess(''), 3000);
      }
    } catch {
      setNameError('Network error');
    }

    setNameLoading(false);
  };

  // Update password
  const handleUpdatePassword = async () => {
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');

    try {
      const res = await fetch(`${API}/api/users/me`, {
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
        setPwSuccess('Password updated successfully!');
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Hero Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                  style={{ boxShadow: '0 4px 20px rgba(26,171,186,0.35)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white select-none"
                  style={{ background: 'linear-gradient(135deg, #1AABBA, #F0BC2C)', fontSize: 32, fontWeight: 800, boxShadow: '0 4px 20px rgba(26,171,186,0.35)' }}
                >
                  {initials}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: '#10B981' }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 style={{ color: '#0F172A', margin: 0 }}>{user?.name ?? 'Loading...'}</h1>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: role.bg, color: role.color }}
                >
                  {title}
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Online</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-6 sm:gap-3 shrink-0 text-center">
              {[
                { label: 'Alerts Handled',   value: '1,247',  color: '#1AABBA' },
                { label: 'Incidents Closed', value: '83',     color: '#10B981' },
                { label: 'Avg MTTR',         value: '38 min', color: '#F0BC2C' },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ color: stat.color, fontSize: 20, fontWeight: 800, lineHeight: 1, margin: 0 }}>{stat.value}</p>
                  <p style={{ color: '#94A3B8', fontSize: 10, margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input id="email" value={user?.email ?? ''} disabled className="pl-8 opacity-60 cursor-not-allowed" />
                </div>
                <p className="text-xs text-slate-400">Email cannot be changed</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title</Label>
                <div className="relative">
                  <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
                  >
                    {['SOC Analyst L1', 'SOC Analyst L2', 'SOC Lead', 'CISO'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {nameError && <p className="text-sm text-red-500">{nameError}</p>}
              {nameSuccess && <p className="text-sm text-green-500">{nameSuccess}</p>}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveName}
                  disabled={nameLoading}
                  style={{ backgroundColor: nameSuccess ? '#10B981' : '#1AABBA', color: '#fff' }}
                >
                  {nameSuccess ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> {nameLoading ? 'Saving...' : 'Save Changes'}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Use a strong, unique password for your SOC account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPw && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ backgroundColor: i <= pwStrength ? pwStrengthColor : '#E2E8F0' }} />
                      ))}
                    </div>
                    <p style={{ color: pwStrengthColor, fontSize: 11 }}>{pwStrengthLabel} password</p>
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
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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

              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-green-500">{pwSuccess}</p>}

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={!currentPw || !pwMatch || pwLoading}
                  style={{ backgroundColor: '#1AABBA', color: '#fff', opacity: (!currentPw || !pwMatch) ? 0.5 : 1 }}
                >
                  <Lock size={14} /> {pwLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose which alerts and updates you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { key: 'emailCritical', label: 'Email — Critical Alerts',    desc: 'Immediate email for critical severity alerts',          icon: Bell,  color: '#CB5229' },
                { key: 'emailIncident', label: 'Email — Incident Updates',   desc: 'Notify when incidents are created or updated',         icon: Bell,  color: '#F0BC2C' },
                { key: 'emailReports',  label: 'Email — Report Ready',       desc: 'Email when a scheduled report has been generated',     icon: Bell,  color: '#1AABBA' },
                { key: 'browserAlerts', label: 'Browser Push Notifications', desc: 'Real-time browser alerts for high severity events',    icon: Bell,  color: '#1AABBA' },
                { key: 'weeklyDigest',  label: 'Weekly Security Digest',     desc: 'Summary of KPIs, alerts, and incidents every Monday', icon: Clock, color: '#10B981' },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                const val = notif[item.key as keyof typeof notif] as boolean;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: `${item.color}18`, border: `1px solid ${item.color}35` }}>
                          <Icon size={16} style={{ color: item.color }} />
                        </div>
                        <div>
                          <p style={{ color: '#334155', fontSize: 13, fontWeight: 500, margin: 0 }}>{item.label}</p>
                          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                      <Switch checked={val} onCheckedChange={v => setNotif(n => ({ ...n, [item.key]: v }))} />
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your last actions inside the SOC platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: '#E2E8F0' }} />
                <div className="space-y-5">
                  {ACTIVITY.map(a => (
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
    </div>
  );
}