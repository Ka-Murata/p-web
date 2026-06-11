import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DialogProps = ComponentProps<'div'> & {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
};

function Dialog({ open, title, description, children, className, ...props }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-pwt-text/35 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn('w-full max-w-sm rounded-[8px] bg-pwt-surface p-5 shadow-pwt-card', className)}
        {...props}
      >
        <h2 id="dialog-title" className="text-lg font-extrabold tracking-normal text-pwt-text">
          {title}
        </h2>
        {description ? (
          <p id="dialog-description" className="mt-2 text-sm leading-6 text-pwt-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export { Dialog };
