import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Bell, FileText, AlertTriangle, Shield,
  BarChart2, Settings, X, LogOut, Users, UserPlus,
} from 'lucide-react';
import { CLIENTS } from '../../data/mockData';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';
import logo from '../../../assets/Logo.png';
import { authClient } from '../../features/auth/auth-client';

const navItems = [
  { path: '/',             label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/alerts',       label: 'Alerts',        icon: Bell,            badge: 101 },
  { path: '/logs',         label: 'Log Explorer',  icon: FileText },
  { path: '/incidents',    label: 'Incidents',     icon: AlertTriangle,   badge: 5 },
  { path: '/threat-intel', label: 'Threat Intel',  icon: Shield },
  { path: '/reports',      label: 'Reports',       icon: BarChart2 },
];

const adminItems = [
  { path: '/users',      label: 'User Management', icon: Users },
  { path: '/add-client', label: 'Add Client',       icon: UserPlus },
];

const clients = Object.values(CLIENTS);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await authClient.signOut();
    navigate('/signin');
  };

  const renderNavItem = (item: { path: string; label: string; icon: any; badge?: number }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-150 group relative',
          isActive
            ? 'bg-teal-light text-teal'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
            style={{ height: 20, backgroundColor: '#1AABBA' }}
          />
        )}
        <Icon size={16} className={isActive ? 'text-teal' : 'text-slate-400 group-hover:text-slate-600'} />
        <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
        {item.badge !== undefined && (
          <span
            className="ml-auto rounded-full px-1.5 py-0.5"
            style={{
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: isActive ? '#1AABBA' : '#CBD5E1',
              color: isActive ? '#fff' : '#475569',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full flex flex-col z-40 bg-white transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{ width: 248, borderRight: '1px solid #E2E8F0', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}
    >
      {/* Logo row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <img src={logo} alt="MN Advising Groupe" style={{ height: 44, width: 'auto', objectFit: 'contain', flex: 1 }} />
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Close menu"
        >
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Live Pill */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ backgroundColor: '#E6F7F9', border: '1px solid #A0DDE4' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#1AABBA' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#1AABBA' }} />
          </span>
          <span style={{ color: '#12889A', fontSize: 11, fontWeight: 600 }}>LIVE</span>
          <span style={{ color: '#64748B', fontSize: 11, marginLeft: 'auto' }}>1,842 eps</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-2 mb-2" style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Navigation
        </p>
        {navItems.map(renderNavItem)}

        {/* Admin Section — only visible to admins */}
        {isAdmin && (
          <>
            <p className="px-2 mt-5 mb-2" style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Administration
            </p>
            {adminItems.map(renderNavItem)}
          </>
        )}

        {/* Client Status */}
        <p className="px-2 mt-5 mb-2" style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Client Status
        </p>
        {clients.map((client) => (
          <div
            key={client.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 hover:bg-slate-50 cursor-default transition-colors"
          >
            <div
              className="flex items-center justify-center rounded-md text-white shrink-0"
              style={{ width: 22, height: 22, backgroundColor: client.color, fontSize: 9, fontWeight: 700 }}
            >
              {client.initials}
            </div>
            <span style={{ color: '#475569', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.shortName}
            </span>
            <div
              className="rounded-full shrink-0"
              style={{
                width: 7, height: 7,
                backgroundColor:
                  client.status === 'healthy' ? '#10B981' :
                  client.status === 'warning' ? '#F0BC2C' : '#CB5229',
              }}
            />
          </div>
        ))}
      </nav>

      <Separator />

      {/* User Footer */}
      <div className="px-4 py-3">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl p-2 transition-colors cursor-pointer ${
              isActive ? 'bg-teal-light' : 'hover:bg-slate-50'
            }`
          }
          title="My Profile"
        >
          {user?.image ? (
            <img src={user.image} alt={user.name} className="rounded-full shrink-0 object-cover" style={{ width: 34, height: 34 }} />
          ) : (
            <div
              className="flex items-center justify-center rounded-full text-white shrink-0"
              style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #1AABBA, #F0BC2C)', fontSize: 12, fontWeight: 700 }}
            >
              {user?.name ? getInitials(user.name) : '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p style={{ color: '#0F172A', fontSize: 12, fontWeight: 600, margin: 0 }} className="truncate">
              {user?.name ?? 'Loading...'}
            </p>
            <p style={{ color: '#94A3B8', fontSize: 10, margin: 0 }} className="truncate">
              {user?.email ?? ''}
            </p>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group" title="Sign out" onClick={handleSignOut}>
            <LogOut size={14} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          </button>
        </NavLink>
      </div>
    </aside>
  );
}