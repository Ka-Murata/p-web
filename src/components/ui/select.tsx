import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'flex min-h-12 w-full appearance-none rounded-[8px] border border-pwt-border bg-pwt-surface px-3 py-2 text-base font-medium text-pwt-text shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pwt-primary-soft disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
