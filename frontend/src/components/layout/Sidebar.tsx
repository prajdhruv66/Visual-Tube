import { Link, NavLink } from 'react-router-dom';
import { Home, History, ListVideo, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useSubscribedChannels } from '@/features/subscriptions/hooks/useSubscribedChannels';
import { useWatchHistory } from '@/features/history/hooks/useWatchHistory';
import { useUserPlaylists } from '@/features/playlists/hooks/usePlaylists';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();

  // Fetch lists only if user is logged in and sidebar is expanded
  const { data: channels, isLoading: isLoadingChannels } = useSubscribedChannels({
    enabled: !!user && !isCollapsed,
  });
  const { data: historyData, isLoading: isLoadingHistory } = useWatchHistory({
    enabled: !!user && !isCollapsed,
  });
  const { data: playlists, isLoading: isLoadingPlaylists } = useUserPlaylists(
    user && !isCollapsed ? user._id : undefined
  );

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
          {/* Home Link */}
          <NavLink
            to="/"
            end
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
            <Home className="h-5 w-5 shrink-0" />
            <span className={cn(isCollapsed && 'lg:hidden')}>Home</span>
          </NavLink>

          {/* Subscriptions Link & List */}
          <div className="flex flex-col gap-1">
            <NavLink
              to="/subscriptions"
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
              <Users className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed && 'lg:hidden')}>Subscriptions</span>
            </NavLink>

            {user && !isCollapsed && (
              <div className="ml-9 flex flex-col gap-1 py-1">
                {isLoadingChannels ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : channels && channels.length > 0 ? (
                  channels.slice(0, 10).map((channel) => (
                    <Link
                      key={channel._id}
                      to={`/channel/${channel.username}`}
                      onClick={onCloseMobile}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                    >
                      <Avatar src={channel.avatar} alt={channel.fullname} size="xs" className="h-5 w-5" />
                      <span className="truncate flex-1 font-medium">{channel.fullname}</span>
                    </Link>
                  ))
                ) : (
                  <span className="text-[10px] text-text-tertiary px-2 py-1">None</span>
                )}
              </div>
            )}
          </div>

          {/* History Link & List */}
          <div className="flex flex-col gap-1">
            <NavLink
              to="/history"
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
              <History className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed && 'lg:hidden')}>History</span>
            </NavLink>

            {user && !isCollapsed && (
              <div className="ml-9 flex flex-col gap-1 py-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {isLoadingHistory ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Skeleton className="h-5 w-8 rounded" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : historyData && historyData.items.length > 0 ? (
                  historyData.items.slice(0, 10).map((video) => (
                    <Link
                      key={video._id}
                      to={`/watch/${video._id}`}
                      onClick={onCloseMobile}
                      className="flex gap-2 rounded-md px-2 py-1 text-[11px] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors min-w-0"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-5 w-8 shrink-0 rounded object-cover bg-surface-2"
                      />
                      <span className="truncate flex-1 font-medium leading-tight">{video.title}</span>
                    </Link>
                  ))
                ) : (
                  <span className="text-[10px] text-text-tertiary px-2 py-1">None</span>
                )}
              </div>
            )}
          </div>

          {/* Playlists Link & List */}
          <div className="flex flex-col gap-1">
            <NavLink
              to="/playlists"
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
              <ListVideo className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed && 'lg:hidden')}>My Playlists</span>
            </NavLink>

            {user && !isCollapsed && (
              <div className="ml-9 flex flex-col gap-1 py-1">
                {isLoadingPlaylists ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Skeleton className="h-3.5 w-3.5 rounded" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : playlists && playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <Link
                      key={playlist._id}
                      to={`/playlists/${playlist._id}`}
                      onClick={onCloseMobile}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors min-w-0"
                    >
                      <ListVideo className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      <span className="truncate flex-1 font-medium">{playlist.name}</span>
                    </Link>
                  ))
                ) : (
                  <span className="text-[10px] text-text-tertiary px-2 py-1">None</span>
                )}
              </div>
            )}
          </div>
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
