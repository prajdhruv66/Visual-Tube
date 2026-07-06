import { NavLink } from 'react-router-dom';
import { Home, History, ListVideo, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/subscriptions', label: 'Subscriptions', icon: Users },
  { to: '/history', label: 'History', icon: History },
  { to: '/playlists', label: 'My Playlists', icon: ListVideo },
];

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-bg pt-16 transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-56',
          'w-56',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-2 text-text-primary'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed && 'lg:hidden')}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onToggle}
          className="hidden items-center gap-4 border-t border-border px-3 py-4 text-sm text-text-secondary hover:text-text-primary lg:flex"
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          <span className={cn(isCollapsed && 'lg:hidden')}>Collapse</span>
        </button>
      </aside>
    </>
  );
}
