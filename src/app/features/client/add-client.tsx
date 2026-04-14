import {
  Building2, Mail, Phone, Calendar, Network,
  Download, Rocket, Save, ChevronRight, Code2,
  CheckCircle2, AlertTriangle, User, XCircle, Info,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

import { useAddClient } from './use-client';
import {
  FieldRow, SectionHeader, ModeToggle, CodeEditor,
  DerivedPill, SelectField, TABS,
} from './add-client-components';
import type { TabKey } from './client-api';

const INDUSTRIES = [
  'Manufacturing','Financial Services','Public Sector',
  'Technology','Retail & E-commerce','Energy & Utilities',
  'Healthcare','Telecommunications',
];
const CONTRACT_STATUSES = ['trial','active','suspended','churned'];
const IC = 'h-9 text-sm';

export default function AddClient() {
  const {
    form, fb, kafka, os,
    activeTab, saveState, errorMsg,
    rawModes, manifestsLoaded,
    slugOk, emailOk, canSave,
    setField, handleSlug, setFb, setKafka, setOs,
    setActiveTab, toggleRawMode, resetRaw, setRawYaml,
    handleSave, handleDownload, handleFieldUpdate,
    getDisplayYaml,
  } = useAddClient();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-wrap" style={{ color: '#94A3B8', fontSize: 12 }}>
        <span>Administration</span><ChevronRight size={12} />
        <span>Clients</span><ChevronRight size={12} />
        <span style={{ color: '#1AABBA', fontWeight: 600 }}>Add New Client</span>
      </div>

      {/* ── SECTION 1 — Client Information ───────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={1} icon={Building2}
            title="Client Information"
            desc="Identity, contact details, and contract metadata for the new tenant." />
          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

            {/* Slug */}
            <div className="md:col-span-2">
              <FieldRow label="Client Slug" required
                hint="Unique identifier — lowercase letters, digits, and hyphens only. Used as Kubernetes namespace suffix and Kafka/OpenSearch prefix.">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input className={`${IC} max-w-xs font-mono`} placeholder="startup-x"
                    value={form.slug} onChange={e => handleSlug(e.target.value)}
                    style={{ borderColor: form.slug && !slugOk ? '#CB5229' : undefined }} />
                  {form.slug && (
                    <span className="flex items-center gap-1 text-xs"
                      style={{ color: slugOk ? '#10B981' : '#CB5229' }}>
                      {slugOk
                        ? <><CheckCircle2 size={12} /> Valid</>
                        : <><AlertTriangle size={12} /> Must start with a letter</>}
                    </span>
                  )}
                </div>
              </FieldRow>

              {form.slug && slugOk && (
                <div className="mt-3 p-3 rounded-xl flex flex-wrap gap-x-6 gap-y-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <DerivedPill label="Namespace"        value={`siem-${form.slug}`} />
                  <DerivedPill label="Kafka Topic"      value={`wazuh-alerts-${form.slug}`} />
                  <DerivedPill label="OpenSearch Index" value={`wazuh-alerts-${form.slug}-*`} />
                </div>
              )}
            </div>

            <FieldRow label="Full Name" required>
              <Input className={IC} placeholder="Startup X S.A."
                value={form.name} onChange={e => setField('name', e.target.value)} />
            </FieldRow>

            <FieldRow label="Short Name">
              <Input className={IC} placeholder="StartupX"
                value={form.shortName} onChange={e => setField('shortName', e.target.value)} />
            </FieldRow>

            <FieldRow label="Industry">
              <SelectField value={form.industry} onChange={v => setField('industry', v)} options={INDUSTRIES} />
            </FieldRow>

            <FieldRow label="Brand Colour">
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setField('color', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <Input className={`${IC} font-mono w-28`} value={form.color}
                  onChange={e => setField('color', e.target.value)} placeholder="#1AABBA" />
                <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ width: 36, height: 36, backgroundColor: form.color }}>
                  {form.shortName?.[0] ?? '?'}
                </div>
              </div>
            </FieldRow>

            <div className="md:col-span-2 pt-1">
              <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contact</p>
            </div>

            <FieldRow label="Contact Name">
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} placeholder="Jean Martin"
                  value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="Contact Email">
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} type="email" placeholder="j.martin@client.fr"
                  value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)}
                  style={{ borderColor: form.contactEmail && !emailOk ? '#CB5229' : undefined }} />
              </div>
            </FieldRow>

            <FieldRow label="Contact Phone (optional)">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} placeholder="+33 6 12 34 56 78"
                  value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="VPN CIDR" required hint="Client network range routed through the SOC VPN.">
              <div className="relative">
                <Network size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8 font-mono`} placeholder="10.10.5.0/24"
                  value={form.vpnCidr} onChange={e => setField('vpnCidr', e.target.value)} />
              </div>
            </FieldRow>

            <div className="md:col-span-2 pt-1">
              <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contract</p>
            </div>

            <FieldRow label="Contract Status">
              <SelectField value={form.contractStatus} onChange={v => setField('contractStatus', v)} options={CONTRACT_STATUSES} />
            </FieldRow>
            <div />

            <FieldRow label="Contract Start Date">
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className={`${IC} pl-8`} type="date"
                  value={form.contractStart} onChange={e => setField('contractStart', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="Contract End Date (optional)">
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className={`${IC} pl-8`} type="date"
                  value={form.contractEnd} onChange={e => setField('contractEnd', e.target.value)} />
              </div>
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 2 — Infrastructure endpoints ─────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={2} icon={Network}
            title="Infrastructure Endpoints"
            desc="Shared Kafka and OpenSearch cluster addresses — required by all manifests." />
          <Separator className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Kafka Bootstrap Servers" required hint="e.g. kafka-broker.siem-infra.svc:9092">
              <Input className={`${IC} font-mono`} placeholder="kafka-broker.siem-infra.svc:9092"
                value={fb.kafkaBootstrap} onChange={e => setFb(f => ({ ...f, kafkaBootstrap: e.target.value }))} />
            </FieldRow>
            <FieldRow label="OpenSearch Host" required hint="e.g. opensearch.siem-infra.svc">
              <Input className={`${IC} font-mono`} placeholder="opensearch.siem-infra.svc"
                value={fb.opensearchHost} onChange={e => setFb(f => ({ ...f, opensearchHost: e.target.value }))} />
            </FieldRow>
          </div>
          {(!fb.kafkaBootstrap || !fb.opensearchHost) && (
            <p className="mt-3 flex items-center gap-1.5" style={{ color: '#CB5229', fontSize: 12 }}>
              <AlertTriangle size={12} /> Both endpoints are required to generate valid manifests.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 3 — Pipeline Manifests ───────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={3} icon={Code2}
            title="Pipeline Configuration — Manifests"
            desc="Five Kubernetes manifests for the client's log ingestion pipeline." />

          {/* Info banner — manifests load after save */}
          {!manifestsLoaded && (
            <div className="mb-5 p-3 rounded-xl flex items-start gap-2"
              style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <Info size={14} style={{ color: '#3B82F6', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: '#1D4ED8', fontSize: 12, margin: 0 }}>
                Manifests are generated by the server. Click <strong>Save Only</strong> first to create the client and load the generated YAML — you can then edit fields or raw YAML and re-save.
              </p>
            </div>
          )}

          <Separator className="mb-5" />

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabKey)}>
            <TabsList className="flex-wrap h-auto gap-1 mb-5">
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map(({ value: tab, label, desc, hasFields }) => {
              const isRaw = rawModes[tab];
              const yaml  = getDisplayYaml(tab);

              return (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {/* Tab header */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{desc(form.slug)}</p>
                    </div>
                    <ModeToggle raw={isRaw} onChange={v => toggleRawMode(tab, v)} />
                  </div>

                  {/* Fields mode */}
                  {!isRaw && hasFields && tab === 'fluentbitConfigMap' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FieldRow label="Mem Buffer Limit" hint="Max in-memory buffer before spilling to disk.">
                        <Input className={IC} value={fb.memBufLimit}
                          onChange={e => setFb(f => ({ ...f, memBufLimit: e.target.value }))}
                          onBlur={() => handleFieldUpdate(tab)}
                          placeholder="50MB" />
                      </FieldRow>
                      <FieldRow label="Refresh Interval (sec)">
                        <Input className={IC} type="number" min={1} value={fb.refreshInterval}
                          onChange={e => setFb(f => ({ ...f, refreshInterval: Number(e.target.value) }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Input Path" hint="Wazuh alert JSON file path on each node.">
                        <Input className={`${IC} font-mono`} value={fb.inputPath}
                          onChange={e => setFb(f => ({ ...f, inputPath: e.target.value }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Kafka Topic (auto-derived)">
                        <Input className={`${IC} font-mono bg-slate-50`}
                          value={form.slug ? `wazuh-alerts-${form.slug}` : '—'} readOnly
                          style={{ color: '#12889A' }} />
                      </FieldRow>
                    </div>
                  )}

                  {!isRaw && hasFields && tab === 'kafkaTopic' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <FieldRow label="Partitions" hint="Number of topic partitions.">
                        <Input className={IC} type="number" min={1} value={kafka.partitions}
                          onChange={e => setKafka(k => ({ ...k, partitions: Number(e.target.value) }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Replicas" hint="Replication factor.">
                        <Input className={IC} type="number" min={1} value={kafka.replicas}
                          onChange={e => setKafka(k => ({ ...k, replicas: Number(e.target.value) }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Retention (ms)" hint="604800000 = 7 days.">
                        <Input className={`${IC} font-mono`} value={kafka.retentionMs}
                          onChange={e => setKafka(k => ({ ...k, retentionMs: e.target.value }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                    </div>
                  )}

                  {!isRaw && hasFields && tab === 'opensearchIndexTemplate' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <FieldRow label="Number of Shards">
                        <Input className={IC} type="number" min={1} value={os.numberOfShards}
                          onChange={e => setOs(o => ({ ...o, numberOfShards: Number(e.target.value) }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Number of Replicas">
                        <Input className={IC} type="number" min={0} value={os.numberOfReplicas}
                          onChange={e => setOs(o => ({ ...o, numberOfReplicas: Number(e.target.value) }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                      <FieldRow label="Refresh Interval" hint="e.g. 5s or 30s.">
                        <Input className={`${IC} font-mono`} value={os.refreshIntervalOs}
                          onChange={e => setOs(o => ({ ...o, refreshIntervalOs: e.target.value }))}
                          onBlur={() => handleFieldUpdate(tab)} />
                      </FieldRow>
                    </div>
                  )}

                  {/* Auto-generated tabs or raw mode — always show YAML editor */}
                  {(!isRaw && !hasFields) && (
                    <div className="rounded-xl p-3"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                      <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
                        Auto-generated from the client slug. Switch to Raw YAML to customise labels, resource limits, or tolerations.
                      </p>
                      <CodeEditor value={yaml} onChange={() => {}} onReset={() => {}} readOnly />
                    </div>
                  )}

                  {isRaw && (
                    <CodeEditor
                      value={yaml}
                      onChange={v => setRawYaml(tab, v)}
                      onReset={() => resetRaw(tab)}
                    />
                  )}

                  {/* YAML preview for field-editable tabs */}
                  {!isRaw && hasFields && manifestsLoaded && (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer select-none py-1"
                        style={{ color: '#1AABBA', fontSize: 12, fontWeight: 600 }}>
                        <Code2 size={13} />
                        Preview generated YAML
                        <ChevronRight size={13} className="group-open:rotate-90 transition-transform ml-auto" />
                      </summary>
                      <div className="mt-3">
                        <CodeEditor value={yaml} onChange={() => {}} onReset={() => {}} readOnly />
                      </div>
                    </details>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── STICKY BOTTOM BAR ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[248px] z-20"
        style={{
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">

          {/* Status */}
          <div style={{ fontSize: 12 }}>
            {saveState === 'error' ? (
              <span className="flex items-center gap-1.5" style={{ color: '#CB5229' }}>
                <XCircle size={13} /> {errorMsg}
              </span>
            ) : saveState === 'saved' ? (
              <span className="flex items-center gap-1.5" style={{ color: '#10B981' }}>
                <CheckCircle2 size={13} /> Client created successfully!
              </span>
            ) : !form.slug ? (
              <span style={{ color: '#94A3B8' }}>Enter a slug to get started</span>
            ) : !slugOk ? (
              <span className="flex items-center gap-1.5" style={{ color: '#CB5229' }}>
                <AlertTriangle size={13} /> Fix the slug format
              </span>
            ) : !form.name.trim() ? (
              <span style={{ color: '#94A3B8' }}>Enter a full name</span>
            ) : !fb.kafkaBootstrap || !fb.opensearchHost ? (
              <span className="flex items-center gap-1.5" style={{ color: '#F0BC2C' }}>
                <AlertTriangle size={13} /> Infrastructure endpoints required (Section 2)
              </span>
            ) : (
              <span className="flex items-center gap-1.5" style={{ color: '#10B981' }}>
                <CheckCircle2 size={13} />
                <span>Ready — <code style={{ color: '#1AABBA', fontSize: 11 }}>siem-{form.slug}</code></span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownload}
              disabled={!manifestsLoaded}
              className="gap-2 text-sm" style={{ borderColor: '#E2E8F0' }}>
              <Download size={14} style={{ color: '#64748B' }} />
              <span className="hidden sm:inline">Download Bundle</span>
              <span className="sm:hidden">Bundle</span>
            </Button>

            <Button variant="outline"
              onClick={() => handleSave(false)}
              disabled={!canSave || saveState === 'saving'}
              className="gap-2 text-sm"
              style={{ borderColor: '#1AABBA', color: '#1AABBA', opacity: !canSave ? 0.45 : 1 }}>
              <Save size={14} />
              <span className="hidden sm:inline">Save Only</span>
              <span className="sm:hidden">Save</span>
            </Button>

            <Button
              onClick={() => handleSave(true)}
              disabled={!canSave || saveState === 'saving'}
              className="gap-2 text-sm"
              style={{
                backgroundColor: saveState === 'saved' ? '#10B981' : '#1AABBA',
                color: '#fff', opacity: !canSave ? 0.45 : 1, minWidth: 140,
                transition: 'background-color 0.3s',
              }}>
              {saveState === 'saving'
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : saveState === 'saved'
                ? <><CheckCircle2 size={14} /> Done!</>
                : <><Rocket size={14} /> Save &amp; Deploy</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}