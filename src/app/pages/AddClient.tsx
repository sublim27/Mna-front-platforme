import { useState, useCallback } from 'react';
import {
  Building2, Mail, Phone, Calendar, Network,
  Download, Rocket, Save, ChevronRight, RotateCcw,
  Code2, FormInput, CheckCircle2, AlertTriangle, Copy, Check, User,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

/* ─────────────────────────────────────────────────────────────────────────────
   Types — aligned with ManifestInput from manifest-generator.ts
───────────────────────────────────────────────────────────────────────────── */
interface ClientForm {
  slug:           string;
  fullName:       string;
  shortName:      string;
  industry:       string;
  brandColor:     string;
  contactName:    string;
  contactEmail:   string;
  contactPhone:   string;
  contractStatus: string;
  contractStart:  string;
  contractEnd:    string;
  vpnCidr:        string;
}

/** Matches optional fields of ManifestInput */
interface FluentBitFields {
  memBufLimit:     string;   // e.g. "50MB"
  refreshInterval: number;   // seconds
  inputPath:       string;   // e.g. "/var/log/wazuh/alerts/alerts.json"
  kafkaBootstrap:  string;   // required by ManifestInput
  opensearchHost:  string;   // required by ManifestInput
}
interface KafkaFields {
  partitions:  number;
  replicas:    number;
  retentionMs: string;   // e.g. "604800000"
}
interface OpenSearchFields {
  numberOfShards:    number;
  numberOfReplicas:  number;
  refreshIntervalOs: string;  // e.g. "5s"  — field name matches ManifestInput
}

/* ─────────────────────────────────────────────────────────────────────────────
   YAML generators — exact output matching manifest-generator.ts
───────────────────────────────────────────────────────────────────────────── */

function deriveKafkaTopic(slug: string)      { return slug ? `soc-${slug}-alerts` : 'soc-<slug>-alerts'; }
function deriveOpensearchIndex(slug: string) { return slug ? `soc-${slug}-logs`   : 'soc-<slug>-logs';   }
function nsName(slug: string)                { return slug ? `siem-${slug}`        : 'siem-<slug>';        }

function genNamespace(slug: string): string {
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${nsName(slug)}
  labels:
    app.kubernetes.io/managed-by: siem-platform
    siem.mn-advising.fr/client: ${slug || '<slug>'}
`;
}

function genFluentBitConfigMap(slug: string, f: FluentBitFields): string {
  const kafkaTopic = deriveKafkaTopic(slug);
  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentbit-config-${slug || '<slug>'}
  namespace: ${nsName(slug)}
  labels:
    siem.mn-advising.fr/client: ${slug || '<slug>'}
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush        5
        Daemon       Off
        Log_Level    info
        Parsers_File parsers.conf

    [INPUT]
        Name              tail
        Path              ${f.inputPath}
        Tag               wazuh.${slug || '<slug>'}
        Parser            json
        Refresh_Interval  ${f.refreshInterval}
        Mem_Buf_Limit     ${f.memBufLimit}
        Skip_Long_Lines   On

    [FILTER]
        Name   record_modifier
        Match  wazuh.${slug || '<slug>'}
        Record clientId ${slug || '<slug>'}

    [FILTER]
        Name    grep
        Match   wazuh.${slug || '<slug>'}
        Regex   clientId ${slug || '<slug>'}

    [OUTPUT]
        Name        kafka
        Match       wazuh.${slug || '<slug>'}
        Brokers     ${f.kafkaBootstrap || '<kafka-bootstrap>'}
        Topics      ${kafkaTopic}
        rdkafka.security.protocol PLAINTEXT
        rdkafka.compression.type  snappy

  parsers.conf: |
    [PARSER]
        Name        json
        Format      json
        Time_Key    timestamp
        Time_Format %Y-%m-%dT%H:%M:%S.%LZ
`;
}

function genFluentBitDaemonSet(slug: string): string {
  return `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentbit-${slug || '<slug>'}
  namespace: ${nsName(slug)}
  labels:
    app: fluentbit-${slug || '<slug>'}
    siem.mn-advising.fr/client: ${slug || '<slug>'}
spec:
  selector:
    matchLabels:
      app: fluentbit-${slug || '<slug>'}
  template:
    metadata:
      labels:
        app: fluentbit-${slug || '<slug>'}
        siem.mn-advising.fr/client: ${slug || '<slug>'}
    spec:
      serviceAccountName: fluentbit
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          effect: NoSchedule
      containers:
        - name: fluentbit
          image: fluent/fluent-bit:2.2
          resources:
            requests:
              cpu:    50m
              memory: 64Mi
            limits:
              cpu:    200m
              memory: 256Mi
          volumeMounts:
            - name: config
              mountPath: /fluent-bit/etc/
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: wazuh-alerts
              mountPath: /var/log/wazuh/alerts
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: fluentbit-config-${slug || '<slug>'}
        - name: varlog
          hostPath:
            path: /var/log
        - name: wazuh-alerts
          hostPath:
            path: /var/ossec/logs/alerts
`;
}

function genKafkaTopic(slug: string, k: KafkaFields): string {
  const kafkaTopic = deriveKafkaTopic(slug);
  return `apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: ${kafkaTopic}
  namespace: siem-infra
  labels:
    strimzi.io/cluster: siem-kafka
    siem.mn-advising.fr/client: ${slug || '<slug>'}
spec:
  partitions: ${k.partitions}
  replicas:   ${k.replicas}
  config:
    retention.ms:        ${k.retentionMs}
    cleanup.policy:      delete
    compression.type:    snappy
    max.message.bytes:   "1048576"
`;
}

function genOpensearchIndexTemplate(slug: string, o: OpenSearchFields, fb: FluentBitFields): string {
  const index   = deriveOpensearchIndex(slug);
  const pattern = index; // pattern is the index name without wildcard
  return `apiVersion: batch/v1
kind: Job
metadata:
  name: opensearch-index-template-${slug || '<slug>'}
  namespace: ${nsName(slug)}
  labels:
    siem.mn-advising.fr/client: ${slug || '<slug>'}
spec:
  ttlSecondsAfterFinished: 120
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: create-index-template
          image: curlimages/curl:8.5.0
          command:
            - sh
            - -c
            - |
              curl -s -X PUT "http://${fb.opensearchHost || '<opensearch-host>'}/_index_template/siem-${slug || '<slug>'}" \\
                -H "Content-Type: application/json" \\
                -d '{
                  "index_patterns": ["${pattern}-*"],
                  "template": {
                    "settings": {
                      "number_of_shards":   ${o.numberOfShards},
                      "number_of_replicas": ${o.numberOfReplicas},
                      "refresh_interval":   "${o.refreshIntervalOs}",
                      "index.lifecycle.name": "siem-alerts-policy"
                    },
                    "mappings": {
                      "properties": {
                        "clientId":   { "type": "keyword" },
                        "severity":   { "type": "keyword" },
                        "status":     { "type": "keyword" },
                        "sourceType": { "type": "keyword" },
                        "timestamp":  { "type": "date"    },
                        "srcIp":      { "type": "ip"      },
                        "dstIp":      { "type": "ip"      },
                        "ruleLevel":  { "type": "integer" },
                        "ruleId":     { "type": "keyword" },
                        "agentId":    { "type": "keyword" },
                        "agentName":  { "type": "keyword" },
                        "fullLog":    { "type": "text"    },
                        "geo": {
                          "properties": {
                            "location": { "type": "geo_point" }
                          }
                        }
                      }
                    }
                  },
                  "priority": 100
                }'
`;
}

function genBundle(slug: string, fb: FluentBitFields, k: KafkaFields, o: OpenSearchFields): string {
  const lines = [
    `# ${'═'.repeat(52)}`,
    `# SIEM Pipeline Manifests — Client: ${slug || '<slug>'}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Apply with: kubectl apply -f ${slug || 'client'}-manifests.yaml`,
    `# ${'═'.repeat(52)}`,
    '---', genNamespace(slug),
    '---', genFluentBitConfigMap(slug, fb),
    '---', genFluentBitDaemonSet(slug),
    '---', genKafkaTopic(slug, k),
    '---', genOpensearchIndexTemplate(slug, o, fb),
  ];
  return lines.join('\n');
}

/* ─────────────────────────────────────────────────────────────────────────────
   Tab key names — MUST match backend raw override keys
───────────────────────────────────────────────────────────────────────────── */
type TabKey = 'namespace' | 'fluentbitConfigMap' | 'fluentbitDaemonSet' | 'kafkaTopic' | 'opensearchIndexTemplate';

const TABS: { value: TabKey; label: string; short: string }[] = [
  { value: 'namespace',               label: 'Namespace',           short: 'NS'   },
  { value: 'fluentbitConfigMap',      label: 'FluentBit Config',    short: 'FB'   },
  { value: 'fluentbitDaemonSet',      label: 'FluentBit DaemonSet', short: 'DS'   },
  { value: 'kafkaTopic',              label: 'Kafka Topic',         short: 'KFK'  },
  { value: 'opensearchIndexTemplate', label: 'OpenSearch Index',    short: 'OS'   },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</Label>
      {children}
      {hint && <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{hint}</p>}
    </div>
  );
}

function SectionHeader({ step, icon: Icon, title, desc }: { step: number; icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#1AABBA18,#1AABBA30)', border: '1px solid #A0DDE4' }}
      >
        <Icon size={20} style={{ color: '#1AABBA' }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="flex items-center justify-center rounded-full text-white"
            style={{ width: 20, height: 20, backgroundColor: '#1AABBA', fontSize: 10, fontWeight: 700 }}
          >
            {step}
          </span>
          <h2 style={{ margin: 0, color: '#0F172A' }}>{title}</h2>
        </div>
        <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

function ModeToggle({ raw, onChange }: { raw: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center p-1 rounded-xl gap-0.5" style={{ backgroundColor: '#F1F5F9', display: 'inline-flex' }}>
      <button
        onClick={() => onChange(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={!raw
          ? { backgroundColor: '#fff', color: '#1AABBA', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
          : { backgroundColor: 'transparent', color: '#94A3B8' }}
      >
        <FormInput size={12} /> Edit Fields
      </button>
      <button
        onClick={() => onChange(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={raw
          ? { backgroundColor: '#1A202C', color: '#68D391', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }
          : { backgroundColor: 'transparent', color: '#94A3B8' }}
      >
        <Code2 size={12} /> Raw YAML
      </button>
    </div>
  );
}

function CodeEditor({
  value, onChange, onReset, readOnly = false,
}: {
  value: string; onChange: (v: string) => void; onReset: () => void; readOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const lines = value.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple keyword colorization via rendered spans would require a parser;
  // we use the textarea approach with line numbers for now.
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#2D3748', backgroundColor: '#1A202C' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 gap-3"
        style={{ backgroundColor: '#2D3748', borderBottom: '1px solid #4A5568' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['#FC8181', '#F6E05E', '#68D391'].map(c => (
              <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span style={{ color: '#718096', fontSize: 11, fontFamily: 'monospace' }}>manifest.yaml</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
            style={{ color: '#A0AEC0' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4A5568')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {copied ? <Check size={11} style={{ color: '#68D391' }} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {readOnly ? (
            <span style={{ color: '#68D391', fontSize: 11, paddingLeft: 6 }}>Read-only</span>
          ) : (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
              style={{ color: '#A0AEC0' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4A5568')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <RotateCcw size={11} /> Reset to generated
            </button>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="flex" style={{ minHeight: 260 }}>
        {/* Line numbers */}
        <div
          className="select-none text-right pr-3 pt-4 pb-4 shrink-0"
          style={{ color: '#4A5568', fontFamily: 'monospace', fontSize: 12, lineHeight: '20px', minWidth: 44, backgroundColor: '#1A202C', paddingLeft: 8 }}
        >
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 bg-transparent outline-none resize-none py-4 pr-4 pl-2"
          style={{
            color: '#E2E8F0',
            fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
            fontSize: 12,
            lineHeight: '20px',
            minHeight: 260,
            caretColor: '#1AABBA',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
      </div>
    </div>
  );
}

/* ── Derived-value pill ── */
function DerivedPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{label}:</span>
      <code
        className="px-2 py-0.5 rounded-md"
        style={{ backgroundColor: '#E6F7F9', color: '#12889A', fontSize: 11, border: '1px solid #A0DDE4' }}
      >
        {value}
      </code>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const INDUSTRIES = [
  'Manufacturing','Financial Services','Public Sector',
  'Technology','Retail & E-commerce','Energy & Utilities',
  'Healthcare','Telecommunications',
];
const CONTRACT_STATUSES = ['trial','active','suspended','churned'];

const SELECT_STYLE: React.CSSProperties = {
  height: 36, width: '100%', borderRadius: 8,
  border: '1px solid #E2E8F0', backgroundColor: '#fff',
  paddingLeft: 12, paddingRight: 12,
  fontSize: 13, color: '#334155', outline: 'none',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */
export default function AddClient() {
  /* — Client form — */
  const [form, setForm] = useState<ClientForm>({
    slug: '', fullName: '', shortName: '', industry: 'Financial Services',
    brandColor: '#1AABBA', contactName: '', contactEmail: '', contactPhone: '',
    contractStatus: 'trial', contractStart: '', contractEnd: '', vpnCidr: '',
  });

  /* — ManifestInput fields — */
  const [fb, setFb] = useState<FluentBitFields>({
    memBufLimit: '50MB', refreshInterval: 5,
    inputPath: '/var/log/wazuh/alerts/alerts.json',
    kafkaBootstrap: '', opensearchHost: '',
  });
  const [kafka, setKafka] = useState<KafkaFields>({ partitions: 3, replicas: 2, retentionMs: '604800000' });
  const [os, setOs] = useState<OpenSearchFields>({ numberOfShards: 2, numberOfReplicas: 1, refreshIntervalOs: '5s' });

  /* — Per-tab raw mode + raw YAML overrides — */
  const [rawModes, setRawModes] = useState<Record<TabKey, boolean>>({
    namespace: false, fluentbitConfigMap: false, fluentbitDaemonSet: false,
    kafkaTopic: false, opensearchIndexTemplate: false,
  });
  const [rawYamls, setRawYamls] = useState<Record<TabKey, string>>({
    namespace:               genNamespace(''),
    fluentbitConfigMap:      genFluentBitConfigMap('', { memBufLimit: '50MB', refreshInterval: 5, inputPath: '/var/log/wazuh/alerts/alerts.json', kafkaBootstrap: '', opensearchHost: '' }),
    fluentbitDaemonSet:      genFluentBitDaemonSet(''),
    kafkaTopic:              genKafkaTopic('', { partitions: 3, replicas: 2, retentionMs: '604800000' }),
    opensearchIndexTemplate: genOpensearchIndexTemplate('', { numberOfShards: 2, numberOfReplicas: 1, refreshIntervalOs: '5s' }, { memBufLimit: '50MB', refreshInterval: 5, inputPath: '', kafkaBootstrap: '', opensearchHost: '' }),
  });

  /* — Save / deploy state — */
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<TabKey>('namespace');

  /* — Helpers — */
  const setField = (k: keyof ClientForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSlug = (v: string) =>
    setField('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-/, ''));

  const getGenerated = useCallback((tab: TabKey): string => {
    switch (tab) {
      case 'namespace':               return genNamespace(form.slug);
      case 'fluentbitConfigMap':      return genFluentBitConfigMap(form.slug, fb);
      case 'fluentbitDaemonSet':      return genFluentBitDaemonSet(form.slug);
      case 'kafkaTopic':              return genKafkaTopic(form.slug, kafka);
      case 'opensearchIndexTemplate': return genOpensearchIndexTemplate(form.slug, os, fb);
    }
  }, [form.slug, fb, kafka, os]);

  const toggleRawMode = (tab: TabKey, v: boolean) => {
    if (v) setRawYamls(y => ({ ...y, [tab]: getGenerated(tab) }));
    setRawModes(m => ({ ...m, [tab]: v }));
  };

  const resetRaw = (tab: TabKey) =>
    setRawYamls(y => ({ ...y, [tab]: getGenerated(tab) }));

  const handleDownload = () => {
    const yaml = genBundle(form.slug, fb, kafka, os);
    const blob  = new Blob([yaml], { type: 'application/x-yaml' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `${form.slug || 'client'}-manifests.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = (deploy: boolean) => {
    setSaving('saving');
    setTimeout(() => { setSaving('saved'); setTimeout(() => setSaving('idle'), 3000); }, 1500);
  };

  /* — Validation — */
  const slugOk  = /^[a-z][a-z0-9-]+$/.test(form.slug);
  const emailOk = !form.contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail);
  const canSave = slugOk && form.fullName.trim().length > 1 && !!fb.kafkaBootstrap && !!fb.opensearchHost;

  const IC = 'h-9 text-sm'; // input class shorthand

  /* — Derived identifiers (shown to user for clarity) — */
  const derivedNs    = form.slug ? `siem-${form.slug}` : '—';
  const derivedTopic = form.slug ? deriveKafkaTopic(form.slug) : '—';
  const derivedIndex = form.slug ? deriveOpensearchIndex(form.slug) : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-wrap" style={{ color: '#94A3B8', fontSize: 12 }}>
        <span>Administration</span>
        <ChevronRight size={12} />
        <span>Clients</span>
        <ChevronRight size={12} />
        <span style={{ color: '#1AABBA', fontWeight: 600 }}>Add New Client</span>
      </div>

      {/* ───────────────────────────────────────────────────────
          SECTION 1 — Client Information
      ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={1} icon={Building2} title="Client Information" desc="Identity, contact details, and contract metadata for the new tenant." />
          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

            {/* Slug */}
            <div className="md:col-span-2">
              <FieldRow label="Client Slug" hint="Unique identifier — lowercase letters, digits, and hyphens only. Used as the Kubernetes namespace suffix and topic/index prefix.">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input
                    className={`${IC} max-w-xs font-mono`}
                    placeholder="startup-x"
                    value={form.slug}
                    onChange={e => handleSlug(e.target.value)}
                    style={{ borderColor: form.slug && !slugOk ? '#CB5229' : undefined }}
                  />
                  {form.slug && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: slugOk ? '#10B981' : '#CB5229' }}>
                      {slugOk ? <><CheckCircle2 size={12} />Valid</> : <><AlertTriangle size={12} />Invalid — must start with a letter</>}
                    </span>
                  )}
                </div>
              </FieldRow>

              {/* Derived identifiers */}
              {form.slug && slugOk && (
                <div className="mt-3 p-3 rounded-xl flex flex-wrap gap-x-6 gap-y-2" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <DerivedPill label="Namespace"       value={derivedNs} />
                  <DerivedPill label="Kafka Topic"     value={derivedTopic} />
                  <DerivedPill label="OpenSearch Index" value={`${derivedIndex}-*`} />
                </div>
              )}
            </div>

            {/* Full Name */}
            <FieldRow label="Full Name">
              <Input className={IC} placeholder="Startup X S.A." value={form.fullName} onChange={e => setField('fullName', e.target.value)} />
            </FieldRow>

            {/* Short Name */}
            <FieldRow label="Short Name">
              <Input className={IC} placeholder="StartupX" value={form.shortName} onChange={e => setField('shortName', e.target.value)} />
            </FieldRow>

            {/* Industry */}
            <FieldRow label="Industry">
              <select style={SELECT_STYLE} value={form.industry} onChange={e => setField('industry', e.target.value)}>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </FieldRow>

            {/* Brand Color */}
            <FieldRow label="Brand Colour">
              <div className="flex items-center gap-3">
                <input type="color" value={form.brandColor} onChange={e => setField('brandColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <Input className={`${IC} font-mono w-28`} value={form.brandColor} onChange={e => setField('brandColor', e.target.value)} placeholder="#1AABBA" />
                <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ width: 36, height: 36, backgroundColor: form.brandColor }}>
                  {form.shortName?.[0] ?? '?'}
                </div>
              </div>
            </FieldRow>

            {/* Contact section divider */}
            <div className="md:col-span-2 pt-1">
              <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contact</p>
            </div>

            <FieldRow label="Contact Name">
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} placeholder="Jean Martin" value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="Contact Email">
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} type="email" placeholder="j.martin@startup-x.fr"
                  value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)}
                  style={{ borderColor: form.contactEmail && !emailOk ? '#CB5229' : undefined }} />
              </div>
            </FieldRow>

            <FieldRow label="Contact Phone (optional)">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8`} placeholder="+33 6 12 34 56 78" value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="VPN CIDR" hint="Client network range routed through the SOC VPN.">
              <div className="relative">
                <Network size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className={`${IC} pl-8 font-mono`} placeholder="10.10.5.0/24" value={form.vpnCidr} onChange={e => setField('vpnCidr', e.target.value)} />
              </div>
            </FieldRow>

            {/* Contract section divider */}
            <div className="md:col-span-2 pt-1">
              <p style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contract</p>
            </div>

            <FieldRow label="Contract Status">
              <select style={SELECT_STYLE} value={form.contractStatus} onChange={e => setField('contractStatus', e.target.value)}>
                {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </FieldRow>

            <div /> {/* spacer */}

            <FieldRow label="Contract Start Date">
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className={`${IC} pl-8`} type="date" value={form.contractStart} onChange={e => setField('contractStart', e.target.value)} />
              </div>
            </FieldRow>

            <FieldRow label="Contract End Date (optional)">
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input className={`${IC} pl-8`} type="date" value={form.contractEnd} onChange={e => setField('contractEnd', e.target.value)} />
              </div>
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────
          SECTION 2 — Infrastructure (required for manifests)
      ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={2} icon={Network} title="Infrastructure Endpoints" desc="Shared Kafka and OpenSearch cluster details — required by all manifests." />
          <Separator className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Kafka Bootstrap Servers *" hint="e.g. kafka-broker.siem-infra.svc:9092">
              <Input className={`${IC} font-mono`} placeholder="kafka-broker.siem-infra.svc:9092"
                value={fb.kafkaBootstrap}
                onChange={e => setFb(f => ({ ...f, kafkaBootstrap: e.target.value }))}
                style={{ borderColor: !fb.kafkaBootstrap ? '#E2E8F0' : undefined }} />
            </FieldRow>
            <FieldRow label="OpenSearch Host *" hint="e.g. opensearch.siem-infra.svc">
              <Input className={`${IC} font-mono`} placeholder="opensearch.siem-infra.svc"
                value={fb.opensearchHost}
                onChange={e => setFb(f => ({ ...f, opensearchHost: e.target.value }))}
                style={{ borderColor: !fb.opensearchHost ? '#E2E8F0' : undefined }} />
            </FieldRow>
          </div>
          {(!fb.kafkaBootstrap || !fb.opensearchHost) && (
            <p className="mt-3 flex items-center gap-1.5" style={{ color: '#CB5229', fontSize: 12 }}>
              <AlertTriangle size={12} /> Both endpoints are required to generate valid manifests.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────
          SECTION 3 — Pipeline Manifests
      ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader step={3} icon={Code2} title="Pipeline Configuration — Manifests"
            desc="Five Kubernetes manifests for the client's log ingestion pipeline. Toggle between field editor and raw YAML per manifest." />
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

            {TABS.map(({ value: tab, label, }) => {
              const isRaw      = rawModes[tab];
              const noFields   = tab === 'namespace' || tab === 'fluentbitDaemonSet';
              const generated  = getGenerated(tab);

              return (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {/* Tab header row */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>
                        {tab === 'namespace'               && `Creates namespace siem-${form.slug || '<slug>'} with SOC labels.`}
                        {tab === 'fluentbitConfigMap'       && 'ConfigMap for Wazuh → Kafka log pipeline with client-isolation filters.'}
                        {tab === 'fluentbitDaemonSet'       && `DaemonSet fluentbit-${form.slug || '<slug>'} running on every node.`}
                        {tab === 'kafkaTopic'              && `Strimzi KafkaTopic in namespace siem-infra.`}
                        {tab === 'opensearchIndexTemplate' && 'Batch Job that creates the OpenSearch index template via curl.'}
                      </p>
                    </div>
                    <ModeToggle raw={isRaw} onChange={v => toggleRawMode(tab, v)} />
                  </div>

                  {/* Fields mode */}
                  {!isRaw && (
                    <>
                      {noFields ? (
                        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                          <p style={{ color: '#94A3B8', fontSize: 12 }}>
                            This manifest is fully auto-generated from the client slug. Switch to Raw YAML to customise labels, resource limits, or tolerations.
                          </p>
                          <CodeEditor value={generated} onChange={() => {}} onReset={() => {}} readOnly />
                        </div>
                      ) : tab === 'fluentbitConfigMap' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FieldRow label="Mem Buffer Limit" hint="Max in-memory buffer before spilling to disk.">
                            <Input className={IC} value={fb.memBufLimit} onChange={e => setFb(f => ({ ...f, memBufLimit: e.target.value }))} placeholder="50MB" />
                          </FieldRow>
                          <FieldRow label="Refresh Interval (sec)" hint="How often FluentBit checks for new log data.">
                            <Input className={IC} type="number" min={1} value={fb.refreshInterval} onChange={e => setFb(f => ({ ...f, refreshInterval: Number(e.target.value) }))} />
                          </FieldRow>
                          <FieldRow label="Input Path" hint="Wazuh alert JSON file path on each node.">
                            <Input className={`${IC} font-mono`} value={fb.inputPath} onChange={e => setFb(f => ({ ...f, inputPath: e.target.value }))} />
                          </FieldRow>
                          {/* Read-only derived fields */}
                          <FieldRow label="Kafka Topic (derived)" hint="Auto-derived from slug — soc-<slug>-alerts.">
                            <Input className={`${IC} font-mono bg-slate-50`} value={deriveKafkaTopic(form.slug)} readOnly style={{ color: '#12889A' }} />
                          </FieldRow>
                        </div>
                      ) : tab === 'kafkaTopic' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <FieldRow label="Partitions" hint="Number of topic partitions.">
                            <Input className={IC} type="number" min={1} value={kafka.partitions} onChange={e => setKafka(k => ({ ...k, partitions: Number(e.target.value) }))} />
                          </FieldRow>
                          <FieldRow label="Replicas" hint="Replication factor.">
                            <Input className={IC} type="number" min={1} value={kafka.replicas} onChange={e => setKafka(k => ({ ...k, replicas: Number(e.target.value) }))} />
                          </FieldRow>
                          <FieldRow label="Retention (ms)" hint="604800000 = 7 days.">
                            <Input className={`${IC} font-mono`} value={kafka.retentionMs} onChange={e => setKafka(k => ({ ...k, retentionMs: e.target.value }))} />
                          </FieldRow>
                        </div>
                      ) : tab === 'opensearchIndexTemplate' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <FieldRow label="Number of Shards">
                            <Input className={IC} type="number" min={1} value={os.numberOfShards} onChange={e => setOs(o => ({ ...o, numberOfShards: Number(e.target.value) }))} />
                          </FieldRow>
                          <FieldRow label="Number of Replicas">
                            <Input className={IC} type="number" min={0} value={os.numberOfReplicas} onChange={e => setOs(o => ({ ...o, numberOfReplicas: Number(e.target.value) }))} />
                          </FieldRow>
                          <FieldRow label="Refresh Interval" hint="e.g. 5s or 30s.">
                            <Input className={`${IC} font-mono`} value={os.refreshIntervalOs} onChange={e => setOs(o => ({ ...o, refreshIntervalOs: e.target.value }))} />
                          </FieldRow>
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Raw YAML mode */}
                  {isRaw && (
                    <CodeEditor
                      value={rawYamls[tab]}
                      onChange={v => setRawYamls(y => ({ ...y, [tab]: v }))}
                      onReset={() => resetRaw(tab)}
                    />
                  )}

                  {/* Live preview (when fields mode & not noFields) */}
                  {!isRaw && !noFields && (
                    <details className="group">
                      <summary
                        className="flex items-center gap-2 cursor-pointer select-none py-1"
                        style={{ color: '#1AABBA', fontSize: 12, fontWeight: 600 }}
                      >
                        <Code2 size={13} />
                        Preview generated YAML
                        <ChevronRight size={13} className="group-open:rotate-90 transition-transform ml-auto" />
                      </summary>
                      <div className="mt-3">
                        <CodeEditor value={generated} onChange={() => {}} onReset={() => {}} readOnly />
                      </div>
                    </details>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────
          STICKY BOTTOM ACTION BAR
      ─────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:left-[248px] z-20"
        style={{
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Status hint */}
          <div style={{ fontSize: 12 }}>
            {saving === 'saved' ? (
              <span className="flex items-center gap-1.5" style={{ color: '#10B981' }}>
                <CheckCircle2 size={13} /> Client saved successfully!
              </span>
            ) : !form.slug ? (
              <span style={{ color: '#94A3B8' }}>Enter a slug to get started</span>
            ) : !slugOk ? (
              <span className="flex items-center gap-1.5" style={{ color: '#CB5229' }}>
                <AlertTriangle size={13} /> Fix the slug format
              </span>
            ) : !form.fullName.trim() ? (
              <span style={{ color: '#94A3B8' }}>Enter a full name</span>
            ) : !fb.kafkaBootstrap || !fb.opensearchHost ? (
              <span className="flex items-center gap-1.5" style={{ color: '#F0BC2C' }}>
                <AlertTriangle size={13} /> Infrastructure endpoints required (Section 2)
              </span>
            ) : (
              <span className="flex items-center gap-1.5" style={{ color: '#10B981' }}>
                <CheckCircle2 size={13} />
                <span>Ready — <code style={{ color: '#1AABBA', fontSize: 11 }}>{nsName(form.slug)}</code></span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownload} className="gap-2 text-sm" style={{ borderColor: '#E2E8F0' }}>
              <Download size={14} style={{ color: '#64748B' }} />
              <span className="hidden sm:inline">Download Bundle</span>
              <span className="sm:hidden">Bundle</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={!canSave || saving === 'saving'}
              className="gap-2 text-sm"
              style={{ borderColor: '#1AABBA', color: '#1AABBA', opacity: !canSave ? 0.45 : 1 }}
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save Only</span>
              <span className="sm:hidden">Save</span>
            </Button>

            <Button
              onClick={() => handleSave(true)}
              disabled={!canSave || saving === 'saving'}
              className="gap-2 text-sm"
              style={{
                backgroundColor: saving === 'saved' ? '#10B981' : '#1AABBA',
                color: '#fff',
                opacity: !canSave ? 0.45 : 1,
                minWidth: 140,
                transition: 'background-color 0.3s',
              }}
            >
              {saving === 'saving' ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deploying…</>
              ) : saving === 'saved' ? (
                <><CheckCircle2 size={14} /> Deployed!</>
              ) : (
                <><Rocket size={14} /> Save &amp; Deploy</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
