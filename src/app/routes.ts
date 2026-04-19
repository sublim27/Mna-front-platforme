import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Incidents from './pages/Incidents';
import ThreatIntel from './pages/ThreatIntel';
import Reports from './pages/Reports';
import SignIn from './features/auth/SignIn';
import SignUp from './features/auth/SignUp';
import { authClient } from './features/auth/auth-client';
import Profile from './pages/Profile';
import UserManagement from './features/user-management';
import AddClient from './features/client/add-client';
import Clients from './features/client/list-client';

async function requireAuth() {
  try {
    const session = await authClient.getSession();
    if (!session.data) {
      return redirect('/signin');  // ← return, not throw
    }
    return null;
  } catch {
    return redirect('/signin');    // ← catch errors too
  }
}

async function requireGuest() {
  try {
    const session = await authClient.getSession();
    if (session.data) {
      return redirect('/');        // ← return, not throw
    }
    return null;
  } catch {
    return null;
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    loader: requireAuth,
    children: [
      { path: 'users', Component: UserManagement },
      { path: 'profile', Component: Profile },
      { index: true, Component: Dashboard },
      { path: 'alerts', Component: Alerts },
      { path: 'logs', Component: Logs },
      { path: 'incidents', Component: Incidents },
      { path: 'threat-intel', Component: ThreatIntel },
      { path: 'reports', Component: Reports },
      { path: 'clients', Component: Clients },
      { path: 'add-client', Component: AddClient },
    ],
  },
  {
    path: '/signin',
    Component: SignIn,
    loader: requireGuest,
  },
  {
    path: '/signup',
    Component: SignUp,
    loader: requireGuest,
  },
  {
    path: '*',
    loader: () => redirect('/signin'),  // ← redirect to signin not dashboard
  },
]);
