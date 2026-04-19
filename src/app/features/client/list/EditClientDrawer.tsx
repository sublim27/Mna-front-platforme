import { useState, type CSSProperties } from 'react';
import { Calendar, CheckCircle2, Mail, Network, Phone, Save, ShieldCheck, Users, X } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { CONTRACT_META, STATUS_META, type ExtendedClient } from './types';
import { formatEvents } from './utils';

const DRAWER_SELECT_STYLE: CSSProperties = {
  height: 36,
  width: '100%',
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  backgroundColor: '#fff',
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 13,
  color: '#334155',
  outline: 'none',
};

export function EditClientDrawer({
  client,
  onClose,
  onSave,
}: {
  client: ExtendedClient;
  onClose: () => void;
  onSave: (updated: ExtendedClient) => Promise<void> | void;
}) {
  const [form, setForm] = useState<ExtendedClient>({ ...client });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setField = <K extends keyof ExtendedClient>(key: K, value: ExtendedClient[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white overflow-hidden" style={{ width: 'min(520px, 100vw)', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', borderLeft: '1px solid #E2E8F0' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl text-white font-bold" style={{ width: 40, height: 40, backgroundColor: form.color, fontSize: 14 }}>
              {form.initials}
            </div>
            <div>
              <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 14, margin: 0 }}>Edit Client</p>
              <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{form.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Full Name</Label>
              <Input className="h-9 text-sm" value={form.name} onChange={(event) => setField('name', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Short Name</Label>
              <Input className="h-9 text-sm" value={form.shortName} onChange={(event) => setField('shortName', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Industry</Label>
              <Input className="h-9 text-sm" value={form.industry} onChange={(event) => setField('industry', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>SIEM Technology</Label>
              <div className="relative">
                <ShieldCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 text-sm pl-8" value={form.siemTechnology} onChange={(event) => setField('siemTechnology', event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(event) => setField('color', event.target.value)} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <Input className="h-9 text-sm font-mono" value={form.color} onChange={(event) => setField('color', event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>VPN CIDR</Label>
              <div className="relative">
                <Network size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 text-sm pl-8 font-mono" value={form.vpnCidr} onChange={(event) => setField('vpnCidr', event.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Operational Status</Label>
              <select style={DRAWER_SELECT_STYLE} value={form.status} onChange={(event) => setField('status', event.target.value as ExtendedClient['status'])}>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Contract Status</Label>
              <select style={DRAWER_SELECT_STYLE} value={form.contractStatus} onChange={(event) => setField('contractStatus', event.target.value as ExtendedClient['contractStatus'])}>
                {Object.entries(CONTRACT_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Contract Start</Label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className="h-9 text-sm pl-8" type="date" value={form.contractStart} onChange={(event) => setField('contractStart', event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Contract End</Label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className="h-9 text-sm pl-8" type="date" value={form.contractEnd} onChange={(event) => setField('contractEnd', event.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ fontSize: 12, fontWeight: 600 }}>Contact Name</Label>
              <div className="relative">
                <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 text-sm pl-8" value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label style={{ fontSize: 12, fontWeight: 600 }}>Email</Label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input className="h-9 text-sm pl-8" type="email" value={form.contactEmail} onChange={(event) => setField('contactEmail', event.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label style={{ fontSize: 12, fontWeight: 600 }}>Phone</Label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input className="h-9 text-sm pl-8" value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Live Metrics</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Agents', value: form.agentsCount.toLocaleString(), color: '#1AABBA' },
                { label: 'Events/Day', value: formatEvents(form.eventsPerDay), color: '#F0BC2C' },
                { label: 'Open Alerts', value: form.openAlerts, color: '#CB5229' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <p style={{ color: metric.color, fontSize: 18, fontWeight: 800, margin: 0 }}>{metric.value}</p>
                  <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{metric.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid #F1F5F9' }}>
          <Button variant="outline" onClick={onClose} style={{ color: '#64748B' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: saved ? '#10B981' : '#1AABBA', color: '#fff', minWidth: 130, transition: 'background-color 0.3s' }}>
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </Button>
        </div>
      </div>
    </>
  );
}
