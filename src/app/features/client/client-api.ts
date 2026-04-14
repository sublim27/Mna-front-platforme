const BASE = 'http://localhost:3000';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedManifests {
  namespace:               string;
  fluentbitConfigMap:      string;
  fluentbitDaemonSet:      string;
  kafkaTopic:              string;
  opensearchIndexTemplate: string;
}

export type TabKey = keyof GeneratedManifests;

// ── POST /api/clients ─────────────────────────────────────────────────────────

export async function createClient(payload: {
  slug: string; name: string; shortName: string; industry: string;
  color: string; contactName: string; contactEmail: string; contactPhone?: string;
  contractStatus: string; contractStart: string; contractEnd?: string; vpnCidr: string;
}) {
  const res = await apiFetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── GET /api/clients/:slug/manifests ─────────────────────────────────────────

export async function fetchManifests(slug: string): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests`);
  return res.json();
}

// ── PATCH /api/clients/:slug/manifests/fields ────────────────────────────────

export async function updateManifestFields(
  slug: string,
  fields: {
    kafkaBootstrap?: string; opensearchHost?: string;
    memBufLimit?: string; refreshInterval?: number; inputPath?: string;
    partitions?: number; replicas?: number; retentionMs?: string;
    numberOfShards?: number; numberOfReplicas?: number; refreshIntervalOs?: string;
  },
): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests/fields`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
  return res.json();
}

// ── PATCH /api/clients/:slug/manifests/raw ───────────────────────────────────

export async function updateRawManifests(
  slug: string,
  raw: Partial<GeneratedManifests>,
): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests/raw`, {
    method: 'PATCH',
    body: JSON.stringify(raw),
  });
  return res.json();
}

// ── POST /api/clients/:slug/deploy ───────────────────────────────────────────

export async function deployClient(slug: string) {
  const res = await apiFetch(`/api/clients/${slug}/deploy`, { method: 'POST' });
  return res.json();
}

// ── GET /api/clients/:slug/manifests/bundle ───────────────────────────────────

export async function downloadBundle(slug: string) {
  const res = await fetch(`${BASE}/api/clients/${slug}/manifests/bundle`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download bundle');
  const yaml = await res.text();
  const blob = new Blob([yaml], { type: 'application/x-yaml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${slug}-manifests.yaml`; a.click();
  URL.revokeObjectURL(url);
}