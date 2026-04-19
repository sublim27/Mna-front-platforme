import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { API_BASE_URL } from './config/api';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const target = `${name}=`;
  const parts = document.cookie.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith(target)) continue;
    return decodeURIComponent(part.slice(target.length));
  }
  return '';
}

function isApiRequest(url: string) {
  if (url.startsWith('/api/')) return true;
  return url.startsWith(API_BASE_URL);
}

export default function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const unsafe = UNSAFE_METHODS.has(method);

      if (!unsafe || !isApiRequest(url) || url.includes('/api/csrf-token')) {
        return originalFetch(input, init);
      }

      if (!readCookie(CSRF_COOKIE_NAME)) {
        await originalFetch(`${API_BASE_URL}/api/csrf-token`, {
          method: 'GET',
          credentials: 'include',
        });
      }

      const csrfToken = readCookie(CSRF_COOKIE_NAME);
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
          headers.set(key, value);
        });
      }
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <RouterProvider router={router} />;
}
