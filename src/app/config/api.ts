type AppImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const explicitApiBaseUrl = (import.meta as AppImportMeta).env?.VITE_API_BASE_URL?.trim();

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function inferBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

function resolveApiBaseUrl() {
  if (explicitApiBaseUrl) {
    return normalizeBaseUrl(explicitApiBaseUrl);
  }

  const origin = inferBrowserOrigin();
  if (!origin) {
    return 'http://localhost:3000';
  }

  // In local frontend dev, backend usually runs on :3000.
  if (origin.includes('localhost:5173') || origin.includes('127.0.0.1:5173')) {
    return 'http://localhost:3000';
  }

  return normalizeBaseUrl(origin);
}

export const API_BASE_URL = resolveApiBaseUrl();
