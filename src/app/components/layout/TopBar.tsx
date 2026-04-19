import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Bell, RefreshCw, Calendar, ChevronDown, Filter, Menu, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../features/notifications/useNotifications';
import type { DirectoryClient } from '../../features/client/use-client-directory';

interface TopBarProps {
  title: string;
  subtitle?: string;
  selectedClient: string;
  clients: DirectoryClient[];
  onClientChange: (client: string) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onMenuClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const TIME_RANGES = ['Last 1 hour', 'Last 4 hours', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];

export function TopBar({
  title, subtitle, selectedClient, clients, onClientChange,
  timeRange, onTimeRangeChange, onMenuClick,
  theme, onToggleTheme,
}: TopBarProps) {
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markRead,
    markAllRead,
  } = useNotifications();

  const activeClient = selectedClient !== 'all'
    ? clients.find((client) => client.id === selectedClient) ?? null
    : null;

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[248px] z-30 flex items-center gap-2 md:gap-3 px-3 md:px-6 bg-card"
      style={{ height: 60, borderBottom: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} className="text-slate-500" />
      </button>

      {/* Page Info */}
      <div className="flex-1 min-w-0">
        <h2 style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.2 }} className="truncate">{title}</h2>
        {subtitle && <p style={{ color: 'var(--muted-foreground)', fontSize: 11, margin: 0, lineHeight: 1 }} className="hidden sm:block truncate">{subtitle}</p>}
      </div>

      {/* Search — hidden on xs */}
      <div className="relative hidden md:block" style={{ width: 220 }}>
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search alerts, IPs, rules..."
          className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
        />
      </div>

      {/* Client Filter — hidden on sm */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => { setShowClientMenu(!showClientMenu); setShowTimeMenu(false); setShowNotifications(false); }}
          className={cn(
            'flex items-center gap-2 px-3 h-8 rounded-lg border text-xs font-medium transition-colors',
            'border-border bg-card text-muted-foreground hover:bg-accent/40'
          )}
        >
          {activeClient ? (
            <><div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeClient.color }} /><span className="hidden lg:inline">{activeClient.shortName}</span></>
          ) : (
            <><Filter size={12} className="text-slate-400" /><span className="hidden lg:inline">All Clients</span></>
          )}
          <ChevronDown size={11} className="text-slate-400" />
        </button>
        {showClientMenu && (
          <div
            className="absolute top-full mt-1 right-0 py-1 rounded-xl shadow-lg z-50 bg-card min-w-[180px]"
            style={{ border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => { onClientChange('all'); setShowClientMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/40 transition-colors text-xs"
              style={{ color: selectedClient === 'all' ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: selectedClient === 'all' ? 600 : 400 }}
            >
              All Clients
            </button>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => { onClientChange(client.id); setShowClientMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/40 transition-colors text-xs"
                style={{ color: selectedClient === client.id ? client.color : 'var(--muted-foreground)', fontWeight: selectedClient === client.id ? 600 : 400 }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                {client.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Range — hidden on xs */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => { setShowTimeMenu(!showTimeMenu); setShowClientMenu(false); setShowNotifications(false); }}
          className="flex items-center gap-2 px-3 h-8 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-accent/40 transition-colors"
        >
          <Calendar size={12} className="text-slate-400" />
          <span className="hidden lg:inline">{timeRange}</span>
          <ChevronDown size={11} className="text-slate-400" />
        </button>
        {showTimeMenu && (
          <div
            className="absolute top-full mt-1 right-0 py-1 rounded-xl shadow-lg z-50 bg-card min-w-[160px]"
            style={{ border: '1px solid var(--border)' }}
          >
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => { onTimeRangeChange(range); setShowTimeMenu(false); }}
                className="w-full px-3 py-2 text-left hover:bg-accent/40 transition-colors text-xs"
                style={{ color: timeRange === range ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: timeRange === range ? 600 : 400 }}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="icon-sm"
        title="Refresh"
        className="hidden sm:inline-flex"
        onClick={() => window.location.reload()}
      >
        <RefreshCw size={14} className="text-slate-400" />
      </Button>

      {/* Theme */}
      <Button
        variant="ghost"
        size="icon-sm"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? (
          <Sun size={14} className="text-amber-400" />
        ) : (
          <Moon size={14} className="text-slate-500" />
        )}
      </Button>

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setShowNotifications((open) => !open);
            setShowClientMenu(false);
            setShowTimeMenu(false);
          }}
        >
          <Bell size={14} className="text-slate-400" />
        </Button>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#CB5229', color: '#fff', fontSize: 9, fontWeight: 700 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {showNotifications && (
          <div
            className="absolute top-full mt-1 right-0 rounded-xl shadow-lg z-50 bg-card w-[320px] max-w-[90vw]"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 700, margin: 0 }}>Notifications</p>
              <button
                onClick={() => { void markAllRead(); }}
                className="text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {notificationsLoading && (
                <p className="px-3 py-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
              )}
              {!notificationsLoading && notificationsError && (
                <p className="px-3 py-4 text-xs" style={{ color: '#CB5229' }}>{notificationsError}</p>
              )}
              {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                <p className="px-3 py-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>No notifications yet.</p>
              )}
              {!notificationsLoading && !notificationsError && notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    void markRead(item.id);
                    if (item.link) navigate(item.link);
                    setShowNotifications(false);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent/40 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: item.isRead ? '#CBD5E1' : '#1AABBA' }}
                    />
                    <div className="min-w-0">
                      <p style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: item.isRead ? 500 : 700, margin: 0 }}>
                        {item.title}
                      </p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: 11, margin: 0 }}>
                        {item.message}
                      </p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: 10, margin: 0 }}>
                        {new Date(item.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timestamp — desktop only */}
      <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }} className="hidden xl:inline shrink-0">
        {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </header>
  );
}
