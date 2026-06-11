import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-[8px] border border-pwt-primary-soft bg-pwt-surface px-3 py-2 text-base text-pwt-text shadow-sm transition placeholder:text-pwt-muted/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pwt-primary-soft disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
