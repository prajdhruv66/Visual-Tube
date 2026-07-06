import { Outlet, Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img src={logo} alt="Visual-Tube" className="h-11 w-11 rounded-lg object-cover" />
          <span className="font-display text-2xl font-bold tracking-tight">
            Visual<span className="text-accent">-Tube</span>
          </span>
        </Link>
        <div className="rounded-lg border border-border bg-surface p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
