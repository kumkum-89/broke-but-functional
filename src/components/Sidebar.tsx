// ============================================================
// components/Sidebar.tsx — Responsive sidebar navigation
// ============================================================

import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Zap,
  TrendingUp,
  Settings,
  Menu,
  X,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export type PageId = 'dashboard' | 'transactions' | 'goals' | 'simulator' | 'forecast' | 'settings';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: React.ElementType; badge?: string; disabled?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, badge: 'Stage 1' },
  { id: 'goals', label: 'Savings Goals', icon: Target, disabled: true, badge: 'Soon' },
  { id: 'simulator', label: 'Decision Sim', icon: Zap, disabled: true, badge: 'Soon' },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp, disabled: true, badge: 'Soon' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: PageId, disabled?: boolean) => {
    if (disabled) return;
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-dark border-b border-[#152252]/60 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a3e635] to-[#84cc16] flex items-center justify-center">
            <Wallet size={14} className="text-[#060b18]" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">Broke But Functional</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-lg hover:bg-[#152252]/60 transition-colors text-slate-400 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          w-64 glass-dark border-r border-[#152252]/60
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#152252]/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#84cc16] flex items-center justify-center flex-shrink-0 glow-lime">
            <Wallet size={18} className="text-[#060b18] font-bold" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">Broke But Functional</p>
            <p className="text-[10px] text-slate-500 mt-0.5">₹10K Challenge · Oct 2026</p>
          </div>
        </div>

        {/* Demo badge */}
        <div className="mx-4 mt-4 mb-1 px-3 py-1.5 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse-slow flex-shrink-0" />
          <span className="text-[10px] text-[#a3e635] font-medium">DEMO · Stage 1 Preview</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id, item.disabled)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  sidebar-item
                  ${isActive
                    ? 'active bg-[#a3e635]/10 text-[#a3e635] border-l-2 border-[#a3e635] pl-[10px]'
                    : item.disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                <Icon
                  size={17}
                  className={`flex-shrink-0 ${isActive ? 'text-[#a3e635]' : ''}`}
                />
                <span className={`text-sm font-medium flex-1 ${isActive ? 'text-[#a3e635]' : ''}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`
                    text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${item.disabled
                      ? 'bg-[#152252] text-slate-500'
                      : 'bg-[#a3e635]/20 text-[#a3e635]'}
                  `}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={12} className="text-[#a3e635]" />}
              </button>
            );
          })}
        </nav>

        {/* Settings + footer */}
        <div className="px-3 pb-4 border-t border-[#152252]/60 pt-3">
          <button
            onClick={() => handleNav('settings')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left sidebar-item
              ${activePage === 'settings' ? 'active text-[#a3e635]' : 'text-slate-400 hover:text-slate-200'}
            `}
          >
            <Settings size={17} className="flex-shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <p className="text-[10px] text-slate-600 text-center mt-3">
            Broke But Functional v1.0 · PROMPT RUN 2026
          </p>
        </div>
      </aside>
    </>
  );
}
