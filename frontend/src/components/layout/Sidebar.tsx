import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, History, ListVideo, Users, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';
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
  const location = useLocation();

  const [isSubscriptionsOpen, setIsSubscriptionsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(224); // 224px is w-56
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

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
        style={isDesktop && !isCollapsed ? { width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px`, maxWidth: `${sidebarWidth}px` } : {}}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-bg pt-16 transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-56',
          'w-56',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Resize Handle */}
        {isDesktop && !isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute top-16 right-0 bottom-0 w-1.5 cursor-col-resize transition-all hover:bg-accent/50 active:bg-accent/70 z-50",
              isResizing ? "bg-accent/70 w-2" : "bg-transparent"
            )}
          />
        )}
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
            <div className={cn(
              "flex items-center justify-between rounded-md pr-1 transition-colors group",
              location.pathname === '/subscriptions'
                ? "bg-surface-2 text-text-primary"
                : "hover:bg-surface-2/45 text-text-secondary"
            )}>
              <NavLink
                to="/subscriptions"
                onClick={onCloseMobile}
                className={cn(
                  'flex flex-1 items-center gap-4 px-3 py-2.5 text-sm font-medium transition-colors rounded-md',
                  location.pathname === '/subscriptions'
                    ? 'text-text-primary'
                    : 'group-hover:text-text-primary'
                )}
              >
                <Users className="h-5 w-5 shrink-0" />
                <span className={cn(isCollapsed && 'lg:hidden')}>Subscriptions</span>
              </NavLink>
              {user && !isCollapsed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSubscriptionsOpen(!isSubscriptionsOpen);
                  }}
                  className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded transition-colors shrink-0 cursor-pointer"
                  aria-label="Toggle Subscriptions Menu"
                >
                  {isSubscriptionsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {user && !isCollapsed && isSubscriptionsOpen && (
              <div className="ml-9 flex flex-col gap-1 py-1">
                {isLoadingChannels ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : channels && channels.length > 0 ? (
                  <>
                    {(showAllSubscriptions ? channels : channels.slice(0, 7)).map((channel) => (
                      <Link
                        key={channel._id}
                        to={`/channel/${channel.username}`}
                        onClick={onCloseMobile}
                        className="flex items-center gap-2.5 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                      >
                        <Avatar src={channel.avatar} alt={channel.fullname} size="xs" className="h-5 w-5" />
                        <span className="truncate flex-1 font-medium">{channel.fullname}</span>
                      </Link>
                    ))}
                    {channels.length > 7 && (
                      <button
                        onClick={() => setShowAllSubscriptions(!showAllSubscriptions)}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors mt-1 cursor-pointer"
                      >
                        {showAllSubscriptions ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            <span>Show Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span>Show More ({channels.length - 7} more)</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-text-tertiary px-2 py-1">None</span>
                )}
              </div>
            )}
          </div>

          {/* History Link & List */}
          <div className="flex flex-col gap-1">
            <div className={cn(
              "flex items-center justify-between rounded-md pr-1 transition-colors group",
              location.pathname === '/history'
                ? "bg-surface-2 text-text-primary"
                : "hover:bg-surface-2/45 text-text-secondary"
            )}>
              <NavLink
                to="/history"
                onClick={onCloseMobile}
                className={cn(
                  'flex flex-1 items-center gap-4 px-3 py-2.5 text-sm font-medium transition-colors rounded-md',
                  location.pathname === '/history'
                    ? 'text-text-primary'
                    : 'group-hover:text-text-primary'
                )}
              >
                <History className="h-5 w-5 shrink-0" />
                <span className={cn(isCollapsed && 'lg:hidden')}>History</span>
              </NavLink>
              {user && !isCollapsed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsHistoryOpen(!isHistoryOpen);
                  }}
                  className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded transition-colors shrink-0 cursor-pointer"
                  aria-label="Toggle History Menu"
                >
                  {isHistoryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {user && !isCollapsed && isHistoryOpen && (
              <div className="ml-9 flex flex-col gap-1 py-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                {isLoadingHistory ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Skeleton className="h-5 w-8 rounded" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : historyData && historyData.items.length > 0 ? (
                  <>
                    {(showAllHistory ? historyData.items : historyData.items.slice(0, 7)).map((video) => (
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
                    ))}
                    {historyData.items.length > 7 && (
                      <button
                        onClick={() => setShowAllHistory(!showAllHistory)}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors mt-1 cursor-pointer"
                      >
                        {showAllHistory ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            <span>Show Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span>Show More ({historyData.items.length - 7} more)</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
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
