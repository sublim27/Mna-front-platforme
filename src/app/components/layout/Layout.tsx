import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useTheme } from '../../features/theme/useTheme';
import { useClientDirectory } from '../../features/client/use-client-directory';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'SOC Dashboard', subtitle: 'Multi-tenant security overview - MN Advising Groupe' },
  '/alerts': { title: 'Alert Management', subtitle: 'Real-time alert monitoring and triage' },
  '/logs': { title: 'Log Explorer', subtitle: 'Search and analyze raw security events' },
  '/incidents': { title: 'Incident Response', subtitle: 'Track, investigate and resolve security incidents' },
  '/threat-intel': { title: 'Threat Intelligence', subtitle: 'IOC feeds, CVE watch, and threat actor profiles' },
  '/reports': { title: 'Reports', subtitle: 'Generate and download security reports' },
  '/clients': { title: 'Client Registry', subtitle: 'Manage tenant profile, contract and operations' },
  '/add-client': { title: 'Add Client', subtitle: 'Create and bootstrap a new tenant pipeline' },
  '/users': { title: 'User Management', subtitle: 'Control platform access and user roles' },
  '/profile': { title: 'My Profile', subtitle: 'Manage your account and preferences' },
};

export function Layout() {
  const [selectedClient, setSelectedClient] = useState('all');
  const [timeRange, setTimeRange] = useState('Last 24 hours');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { clients } = useClientDirectory();

  const pageInfo = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/'];
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (selectedClient === 'all') return;
    if (clients.some((client) => client.id === selectedClient)) return;
    setSelectedClient('all');
  }, [clients, selectedClient]);

  return (
    <div className="bg-background min-h-screen" style={{ fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={closeSidebar} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} clients={clients} />

      <div className="lg:ml-[248px] flex flex-col min-h-screen">
        <TopBar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          selectedClient={selectedClient}
          clients={clients}
          onClientChange={setSelectedClient}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onMenuClick={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="pt-[60px] flex-1">
          <Outlet context={{ selectedClient, timeRange }} />
        </div>
      </div>
    </div>
  );
}
