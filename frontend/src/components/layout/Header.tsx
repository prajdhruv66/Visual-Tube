import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Upload, LogOut, Settings, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import logo from '@/assets/logo.png';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-bg/95 px-4 backdrop-blur">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="flex shrink-0 items-center gap-2">
        <img src={logo} alt="Visual-Tube" className="h-9 w-9 rounded-md object-cover" />
        <span className="hidden font-display text-lg font-bold tracking-tight sm:block">
          Visual<span className="text-accent">-Tube</span>
        </span>
      </Link>

      <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-xl items-center">
        <div className="flex w-full items-center rounded-full border border-border bg-surface focus-within:border-accent">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Visual-Tube"
            aria-label="Search Visual-Tube"
            className="h-10 w-full flex-1 bg-transparent px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-10 w-12 shrink-0 items-center justify-center rounded-r-full border-l border-border text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {isAuthenticated ? (
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/upload"
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary sm:flex"
          >
            <Upload className="h-5 w-5" />
            <span className="hidden md:inline">Upload</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
              <Avatar src={user?.avatar} alt={user?.username ?? 'U'} size="sm" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-text-primary">{user?.fullname}</p>
                  <p className="truncate text-xs text-text-secondary">@{user?.username}</p>
                </div>
                <Link
                  to={`/channel/${user?.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2"
                >
                  <UserRound className="h-4 w-4" /> Your channel
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-muted"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link
          to="/login"
          className="shrink-0 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
        >
          Log in
        </Link>
      )}
    </header>
  );
}
