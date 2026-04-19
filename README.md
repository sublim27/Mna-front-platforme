# SIEM Dashboard Frontend

React + Vite frontend for the SIEM platform.

## Run locally

```bash
npm install
npm run dev
```

## Environment

Create a `.env` file (or `.env.local`) and set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

If `VITE_API_BASE_URL` is not set, the app falls back to `window.location.origin`.
