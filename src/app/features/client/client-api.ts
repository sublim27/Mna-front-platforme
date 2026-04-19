import { API_BASE_URL } from '../../config/api';

const BASE = API_BASE_URL;

type ApiErrorBody = {
  message?: string;
};

async function parseJsonBody<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await parseJsonBody<ApiErrorBody>(res);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  return res;
}

// Types
export interface GeneratedManifests {
  namespace: string;
  fluentbitConfigMap: string;
  fluentbitDaemonSet: string;
  kafkaTopic: string;
  opensearchIndexTemplate: string;
}

export type TabKey = keyof GeneratedManifests;

export interface ClientListItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  industry: string;
  siemTechnology: string;
  color: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  contractStatus: 'trial' | 'active' | 'suspended' | 'churned';
  contractStart: string;
  contractEnd: string | null;
  kafkaTopic: string;
  opensearchIndex: string;
  vpnCidr: string;
  deployStatus: 'not_deployed' | 'pending' | 'deployed' | 'failed' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    total: number;
    critical: number;
    high: number;
    open: number;
  };
}

// POST /api/clients
export async function createClient(payload: {
  slug: string;
  name: string;
  shortName: string;
  industry: string;
  siemTechnology: string;
  color: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contractStatus: string;
  contractStart: string;
  contractEnd?: string;
  vpnCidr: string;
}) {
  const res = await apiFetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJsonBody(res);
}

export async function fetchClients(): Promise<ClientListItem[]> {
  const res = await apiFetch('/api/clients');
  return (await parseJsonBody<ClientListItem[]>(res)) ?? [];
}

export async function removeClient(slug: string) {
  const res = await apiFetch(`/api/clients/${slug}`, { method: 'DELETE' });
  return parseJsonBody(res);
}

export async function updateClient(
  slug: string,
  payload: Partial<{
    name: string;
    shortName: string;
    industry: string;
    siemTechnology: string;
    color: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contractStatus: 'trial' | 'active' | 'suspended' | 'churned';
    contractEnd: string;
    vpnCidr: string;
  }>,
) {
  const res = await apiFetch(`/api/clients/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return parseJsonBody(res);
}

// GET /api/clients/:slug/manifests
export async function fetchManifests(slug: string): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests`);
  const data = await parseJsonBody<GeneratedManifests>(res);
  if (!data) throw new Error('Invalid manifests response');
  return data;
}

// PATCH /api/clients/:slug/manifests/fields
export async function updateManifestFields(
  slug: string,
  fields: {
    kafkaBootstrap?: string;
    opensearchHost?: string;
    memBufLimit?: string;
    refreshInterval?: number;
    inputPath?: string;
    partitions?: number;
    replicas?: number;
    retentionMs?: string;
    numberOfShards?: number;
    numberOfReplicas?: number;
    refreshIntervalOs?: string;
  },
): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests/fields`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
  const data = await parseJsonBody<GeneratedManifests>(res);
  if (!data) throw new Error('Invalid manifests response');
  return data;
}

// PATCH /api/clients/:slug/manifests/raw
export async function updateRawManifests(
  slug: string,
  raw: Partial<GeneratedManifests>,
): Promise<GeneratedManifests> {
  const res = await apiFetch(`/api/clients/${slug}/manifests/raw`, {
    method: 'PATCH',
    body: JSON.stringify(raw),
  });
  const data = await parseJsonBody<GeneratedManifests>(res);
  if (!data) throw new Error('Invalid manifests response');
  return data;
}

// POST /api/clients/:slug/deploy
export async function deployClient(slug: string) {
  const res = await apiFetch(`/api/clients/${slug}/deploy`, { method: 'POST' });
  return parseJsonBody(res);
}

// GET /api/clients/:slug/manifests/bundle
export async function downloadBundle(slug: string) {
  const res = await fetch(`${BASE}/api/clients/${slug}/manifests/bundle`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download bundle');

  const yaml = await res.text();
  const blob = new Blob([yaml], { type: 'application/x-yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-manifests.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}
