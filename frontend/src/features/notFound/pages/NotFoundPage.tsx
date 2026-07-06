import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-text-secondary">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="font-display text-3xl font-bold text-text-primary">404</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Page Not Found. The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to Home
      </Link>
    </div>
  );
}
