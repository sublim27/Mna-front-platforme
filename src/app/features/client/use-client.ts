import { useState, useCallback } from 'react';
import {
  GeneratedManifests, TabKey,
  createClient, fetchManifests, updateManifestFields,
  updateRawManifests, deployClient, downloadBundle,
} from './client-api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientForm {
  slug:           string;
  name:           string;
  shortName:      string;
  industry:       string;
  color:          string;
  contactName:    string;
  contactEmail:   string;
  contactPhone:   string;
  contractStatus: string;
  contractStart:  string;
  contractEnd:    string;
  vpnCidr:        string;
}

export interface FluentBitFields {
  memBufLimit:     string;
  refreshInterval: number;
  inputPath:       string;
  kafkaBootstrap:  string;
  opensearchHost:  string;
}

export interface KafkaFields {
  partitions:  number;
  replicas:    number;
  retentionMs: string;
}

export interface OpenSearchFields {
  numberOfShards:    number;
  numberOfReplicas:  number;
  refreshIntervalOs: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: ClientForm = {
  slug: '', name: '', shortName: '', industry: 'Financial Services',
  color: '#1AABBA', contactName: '', contactEmail: '', contactPhone: '',
  contractStatus: 'trial', contractStart: '', contractEnd: '', vpnCidr: '',
};

const DEFAULT_FB: FluentBitFields = {
  memBufLimit: '50MB', refreshInterval: 5,
  inputPath: '/var/log/wazuh/alerts/alerts.json',
  kafkaBootstrap: '', opensearchHost: '',
};

const DEFAULT_KAFKA: KafkaFields = { partitions: 3, replicas: 2, retentionMs: '604800000' };
const DEFAULT_OS: OpenSearchFields = { numberOfShards: 2, numberOfReplicas: 1, refreshIntervalOs: '5s' };

const EMPTY_MANIFESTS: GeneratedManifests = {
  namespace: '', fluentbitConfigMap: '', fluentbitDaemonSet: '',
  kafkaTopic: '', opensearchIndexTemplate: '',
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAddClient() {
  const [form, setForm]   = useState<ClientForm>(DEFAULT_FORM);
  const [fb, setFb]       = useState<FluentBitFields>(DEFAULT_FB);
  const [kafka, setKafka] = useState<KafkaFields>(DEFAULT_KAFKA);
  const [os, setOs]       = useState<OpenSearchFields>(DEFAULT_OS);

  // Manifests fetched from server after client is created
  const [manifests, setManifests]     = useState<GeneratedManifests>(EMPTY_MANIFESTS);
  const [manifestsLoaded, setManifestsLoaded] = useState(false);

  // Per-tab raw YAML overrides (user edits)
  const [rawModes, setRawModes] = useState<Record<TabKey, boolean>>({
    namespace: false, fluentbitConfigMap: false, fluentbitDaemonSet: false,
    kafkaTopic: false, opensearchIndexTemplate: false,
  });
  const [rawYamls, setRawYamls] = useState<Record<TabKey, string>>({
    namespace: '', fluentbitConfigMap: '', fluentbitDaemonSet: '',
    kafkaTopic: '', opensearchIndexTemplate: '',
  });

  const [activeTab, setActiveTab] = useState<TabKey>('namespace');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  // ── Field helpers ─────────────────────────────────────────────────────────

  const setField = (k: keyof ClientForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSlug = (v: string) =>
    setField('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-/, ''));

  // ── Raw mode toggle ───────────────────────────────────────────────────────

  const toggleRawMode = useCallback((tab: TabKey, v: boolean) => {
    if (v) {
      // Entering raw mode: seed editor with current server manifest
      setRawYamls(y => ({ ...y, [tab]: manifests[tab] || '' }));
    }
    setRawModes(m => ({ ...m, [tab]: v }));
  }, [manifests]);

  const resetRaw = useCallback((tab: TabKey) => {
    // Reset raw override back to server-generated value
    setRawYamls(y => ({ ...y, [tab]: manifests[tab] || '' }));
  }, [manifests]);

  const setRawYaml = (tab: TabKey, v: string) =>
    setRawYamls(y => ({ ...y, [tab]: v }));

  // ── Validation ────────────────────────────────────────────────────────────

  const slugOk  = /^[a-z][a-z0-9-]+$/.test(form.slug);
  const emailOk = !form.contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail);
  const canSave = slugOk && form.name.trim().length > 1 && !!fb.kafkaBootstrap && !!fb.opensearchHost && !!form.vpnCidr;

  // ── Save handler ──────────────────────────────────────────────────────────

  const handleSave = async (deploy: boolean) => {
    if (!canSave) return;
    setSaveState('saving');
    setErrorMsg('');

    try {
      // 1. Create client
      await createClient({
        slug:           form.slug,
        name:           form.name,
        shortName:      form.shortName,
        industry:       form.industry,
        color:          form.color,
        contactName:    form.contactName,
        contactEmail:   form.contactEmail,
        contactPhone:   form.contactPhone || undefined,
        contractStatus: form.contractStatus,
        contractStart:  form.contractStart,
        contractEnd:    form.contractEnd || undefined,
        vpnCidr:        form.vpnCidr,
      });

      // 2. Save manifest field overrides → get back server-generated manifests
      const updatedManifests = await updateManifestFields(form.slug, {
        kafkaBootstrap:    fb.kafkaBootstrap,
        opensearchHost:    fb.opensearchHost,
        memBufLimit:       fb.memBufLimit,
        refreshInterval:   fb.refreshInterval,
        inputPath:         fb.inputPath,
        partitions:        kafka.partitions,
        replicas:          kafka.replicas,
        retentionMs:       kafka.retentionMs,
        numberOfShards:    os.numberOfShards,
        numberOfReplicas:  os.numberOfReplicas,
        refreshIntervalOs: os.refreshIntervalOs,
      });
      setManifests(updatedManifests);
      setManifestsLoaded(true);

      // 3. Save raw YAML overrides for tabs that are in raw mode
      const rawPayload: Partial<GeneratedManifests> = {};
      (Object.keys(rawModes) as TabKey[]).forEach(tab => {
        if (rawModes[tab] && rawYamls[tab]) rawPayload[tab] = rawYamls[tab];
      });
      if (Object.keys(rawPayload).length > 0) {
        const withRaw = await updateRawManifests(form.slug, rawPayload);
        setManifests(withRaw);
      }

      // 4. Deploy if requested
      if (deploy) await deployClient(form.slug);

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3500);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong');
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 4000);
    }
  };

  // ── Field update after creation ───────────────────────────────────────────
  // Called when user edits fields AFTER the client is already created

  const handleFieldUpdate = async (tab: TabKey) => {
    if (!manifestsLoaded) return;
    try {
      const updated = await updateManifestFields(form.slug, {
        kafkaBootstrap:    fb.kafkaBootstrap,
        opensearchHost:    fb.opensearchHost,
        memBufLimit:       fb.memBufLimit,
        refreshInterval:   fb.refreshInterval,
        inputPath:         fb.inputPath,
        partitions:        kafka.partitions,
        replicas:          kafka.replicas,
        retentionMs:       kafka.retentionMs,
        numberOfShards:    os.numberOfShards,
        numberOfReplicas:  os.numberOfReplicas,
        refreshIntervalOs: os.refreshIntervalOs,
      });
      setManifests(updated);
    } catch {
      // silently ignore — will be saved on final submit
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!form.slug || !slugOk) return;
    try {
      await downloadBundle(form.slug);
    } catch (err: any) {
      setErrorMsg(err.message);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  // ── Current YAML to show in editor ───────────────────────────────────────
  // If in raw mode: show user's raw edits
  // If not: show server-generated manifest (or placeholder)

  const getDisplayYaml = (tab: TabKey): string => {
    if (rawModes[tab]) return rawYamls[tab];
    if (manifestsLoaded) return manifests[tab];
    return `# ${tab} manifest will appear here after saving the client.\n# Fill in the form above and click "Save Only" to preview.`;
  };

  return {
    form, fb, kafka, os,
    activeTab, saveState, errorMsg,
    rawModes, manifestsLoaded,
    slugOk, emailOk, canSave,
    setField, handleSlug, setFb, setKafka, setOs,
    setActiveTab, toggleRawMode, resetRaw, setRawYaml,
    handleSave, handleDownload, handleFieldUpdate,
    getDisplayYaml,
  };
}