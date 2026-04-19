import { useState, type ReactNode } from 'react';
import { Copy, Check, RotateCcw, FormInput, Code2, type LucideIcon } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { TabKey } from './client-api';

// ─── FieldRow ─────────────────────────────────────────────────────────────────

export function FieldRow({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
        {label}{required && <span style={{ color: '#CB5229', marginLeft: 2 }}>*</span>}
      </Label>
      {children}
      {hint && <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{hint}</p>}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  step, icon: Icon, title, desc,
}: {
  step: number; icon: LucideIcon; title: string; desc: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#1AABBA18,#1AABBA30)', border: '1px solid #A0DDE4' }}>
        <Icon size={20} style={{ color: '#1AABBA' }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="flex items-center justify-center rounded-full text-white"
            style={{ width: 20, height: 20, backgroundColor: '#1AABBA', fontSize: 10, fontWeight: 700 }}>
            {step}
          </span>
          <h2 style={{ margin: 0, color: '#0F172A', fontSize: 16, fontWeight: 700 }}>{title}</h2>
        </div>
        <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

export function ModeToggle({ raw, onChange }: { raw: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center p-1 rounded-xl gap-0.5" style={{ backgroundColor: '#F1F5F9', display: 'inline-flex' }}>
      <button onClick={() => onChange(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={!raw
          ? { backgroundColor: '#fff', color: '#1AABBA', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
          : { backgroundColor: 'transparent', color: '#94A3B8' }}>
        <FormInput size={12} /> Edit Fields
      </button>
      <button onClick={() => onChange(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={raw
          ? { backgroundColor: '#1A202C', color: '#68D391', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }
          : { backgroundColor: 'transparent', color: '#94A3B8' }}>
        <Code2 size={12} /> Raw YAML
      </button>
    </div>
  );
}

// ─── CodeEditor ───────────────────────────────────────────────────────────────

export function CodeEditor({
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

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#2D3748', backgroundColor: '#1A202C' }}>
      <div className="flex items-center justify-between px-4 py-2 gap-3"
        style={{ backgroundColor: '#2D3748', borderBottom: '1px solid #4A5568' }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['#FC8181','#F6E05E','#68D391'].map(c => (
              <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span style={{ color: '#718096', fontSize: 11, fontFamily: 'monospace' }}>manifest.yaml</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
            style={{ color: '#A0AEC0' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4A5568')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            {copied ? <Check size={11} style={{ color: '#68D391' }} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {readOnly
            ? <span style={{ color: '#68D391', fontSize: 11, paddingLeft: 6 }}>Read-only</span>
            : (
              <button onClick={onReset}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                style={{ color: '#A0AEC0' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4A5568')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <RotateCcw size={11} /> Reset to generated
              </button>
            )}
        </div>
      </div>
      <div className="flex" style={{ minHeight: 260 }}>
        <div className="select-none text-right pr-3 pt-4 pb-4 shrink-0"
          style={{ color: '#4A5568', fontFamily: 'monospace', fontSize: 12, lineHeight: '20px', minWidth: 44, paddingLeft: 8 }}>
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
            fontSize: 12, lineHeight: '20px', minHeight: 260,
            caretColor: '#1AABBA',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
      </div>
    </div>
  );
}

// ─── DerivedPill ──────────────────────────────────────────────────────────────

export function DerivedPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{label}:</span>
      <code className="px-2 py-0.5 rounded-md"
        style={{ backgroundColor: '#E6F7F9', color: '#12889A', fontSize: 11, border: '1px solid #A0DDE4' }}>
        {value}
      </code>
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────

export function SelectField({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        height: 36, width: '100%', borderRadius: 8,
        border: '1px solid #E2E8F0', backgroundColor: '#fff',
        paddingLeft: 12, paddingRight: 12,
        fontSize: 13, color: '#334155', outline: 'none',
      }}>
      {options.map(o => (
        <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
      ))}
    </select>
  );
}

// ─── Tab metadata ─────────────────────────────────────────────────────────────

export const TABS: {
  value: TabKey; label: string; short: string;
  desc: (slug: string) => string;
  hasFields: boolean;
}[] = [
  {
    value: 'namespace', label: 'Namespace', short: 'NS', hasFields: false,
    desc: (slug) => `Creates namespace siem-${slug || '<slug>'} with SOC labels.`,
  },
  {
    value: 'fluentbitConfigMap', label: 'FluentBit Config', short: 'FB', hasFields: true,
    desc: () => 'ConfigMap for Wazuh → Kafka log pipeline with client-isolation filters.',
  },
  {
    value: 'fluentbitDaemonSet', label: 'FluentBit DaemonSet', short: 'DS', hasFields: false,
    desc: (slug) => `DaemonSet fluentbit-${slug || '<slug>'} running on every node.`,
  },
  {
    value: 'kafkaTopic', label: 'Kafka Topic', short: 'KFK', hasFields: true,
    desc: () => 'Strimzi KafkaTopic CR in namespace siem-infra.',
  },
  {
    value: 'opensearchIndexTemplate', label: 'OpenSearch Index', short: 'OS', hasFields: true,
    desc: () => 'Batch Job that creates the OpenSearch index template via curl.',
  },
];
