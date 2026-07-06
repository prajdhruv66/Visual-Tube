import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initial = alt?.charAt(0).toUpperCase() ?? '?';
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full bg-surface-3 flex items-center justify-center font-display font-semibold text-text-secondary ring-1 ring-border',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
