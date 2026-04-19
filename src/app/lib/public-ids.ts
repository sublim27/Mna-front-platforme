type EntityKind = 'alert' | 'incident' | 'log';

const REF_STORAGE_KEY = 'siem.secure_refs.v1';
const REF_TTL_MS = 24 * 60 * 60 * 1000;
const REF_LIMIT = 300;

type RefEntry = {
  kind: EntityKind;
  rawId: string;
  createdAt: number;
};

type RefStore = Record<string, RefEntry>;

const PREFIX_BY_KIND: Record<EntityKind, string> = {
  alert: 'ALT',
  incident: 'INC',
  log: 'LOG',
};

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function now() {
  return Date.now();
}

function safeParseStore(serialized: string | null): RefStore {
  if (!serialized) return {};
  try {
    const parsed = JSON.parse(serialized) as RefStore;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function readStore(): RefStore {
  if (typeof window === 'undefined') return {};
  return safeParseStore(window.sessionStorage.getItem(REF_STORAGE_KEY));
}

function writeStore(store: RefStore) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(REF_STORAGE_KEY, JSON.stringify(store));
}

function pruneStore(store: RefStore) {
  const cutoff = now() - REF_TTL_MS;
  const entries = Object.entries(store)
    .filter(([, entry]) => entry.createdAt >= cutoff)
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, REF_LIMIT);
  return Object.fromEntries(entries);
}

function generateRefToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-8)}`;
}

export function toPublicId(kind: EntityKind, rawId: string) {
  const hash = fnv1a32(`${kind}:${rawId}`).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
  return `${PREFIX_BY_KIND[kind]}-${hash}`;
}

export function createSecureRef(kind: EntityKind, rawId: string) {
  const token = generateRefToken();
  const store = pruneStore(readStore());
  store[token] = {
    kind,
    rawId,
    createdAt: now(),
  };
  writeStore(store);
  return token;
}

export function resolveSecureRef(kind: EntityKind, token: string) {
  if (!token) return null;
  const store = pruneStore(readStore());
  writeStore(store);
  const entry = store[token];
  if (!entry || entry.kind !== kind) return null;
  return entry.rawId;
}

