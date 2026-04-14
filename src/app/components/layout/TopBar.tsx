import { useState } from 'react';
import { Search, Bell, RefreshCw, Calendar, ChevronDown, Filter, Menu } from 'lucide-react';
import { CLIENTS } from '../../data/mockData';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  selectedClient: string;
  onClientChange: (client: string) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onMenuClick: () => void;
}

const TIME_RANGES = ['Last 1 hour', 'Last 4 hours', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];

export function TopBar({
  title, subtitle, selectedClient, onClientChange,
  timeRange, onTimeRangeChange, onMenuClick,
}: TopBarProps) {
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  const clients = Object.values(CLIENTS);
  const activeClient = selectedClient !== 'all' ? CLIENTS[selectedClient] : null;

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[248px] z-30 flex items-center gap-2 md:gap-3 px-3 md:px-6 bg-white"
      style={{ height: 60, borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
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
        <h2 style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.2 }} className="truncate">{title}</h2>
        {subtitle && <p style={{ color: '#94A3B8', fontSize: 11, margin: 0, lineHeight: 1 }} className="hidden sm:block truncate">{subtitle}</p>}
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
          onClick={() => { setShowClientMenu(!showClientMenu); setShowTimeMenu(false); }}
          className={cn(
            'flex items-center gap-2 px-3 h-8 rounded-lg border text-xs font-medium transition-colors',
            'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
            className="absolute top-full mt-1 right-0 py-1 rounded-xl shadow-lg z-50 bg-white min-w-[180px]"
            style={{ border: '1px solid #E2E8F0' }}
          >
            <button
              onClick={() => { onClientChange('all'); setShowClientMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-xs"
              style={{ color: selectedClient === 'all' ? '#1AABBA' : '#64748B', fontWeight: selectedClient === 'all' ? 600 : 400 }}
            >
              All Clients
            </button>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => { onClientChange(client.id); setShowClientMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-xs"
                style={{ color: selectedClient === client.id ? client.color : '#64748B', fontWeight: selectedClient === client.id ? 600 : 400 }}
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
          onClick={() => { setShowTimeMenu(!showTimeMenu); setShowClientMenu(false); }}
          className="flex items-center gap-2 px-3 h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Calendar size={12} className="text-slate-400" />
          <span className="hidden lg:inline">{timeRange}</span>
          <ChevronDown size={11} className="text-slate-400" />
        </button>
        {showTimeMenu && (
          <div
            className="absolute top-full mt-1 right-0 py-1 rounded-xl shadow-lg z-50 bg-white min-w-[160px]"
            style={{ border: '1px solid #E2E8F0' }}
          >
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => { onTimeRangeChange(range); setShowTimeMenu(false); }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors text-xs"
                style={{ color: timeRange === range ? '#1AABBA' : '#64748B', fontWeight: timeRange === range ? 600 : 400 }}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <Button variant="ghost" size="icon-sm" title="Refresh" className="hidden sm:inline-flex">
        <RefreshCw size={14} className="text-slate-400" />
      </Button>

      {/* Notifications */}
      <div className="relative">
        <Button variant="ghost" size="icon-sm">
          <Bell size={14} className="text-slate-400" />
        </Button>
        <span
          className="absolute top-0.5 right-0.5 rounded-full"
          style={{ width: 6, height: 6, backgroundColor: '#CB5229' }}
        />
      </div>

      {/* Timestamp — desktop only */}
      <span style={{ color: '#CBD5E1', fontSize: 11 }} className="hidden xl:inline shrink-0">
        {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </header>
  );
}
