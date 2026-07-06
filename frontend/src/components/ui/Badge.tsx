import { cn } from '@/utils/cn';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs bg-black/75 px-1.5 py-0.5 font-mono text-[11px] leading-none text-white',
        className
      )}
    >
      {children}
    </span>
  );
}
