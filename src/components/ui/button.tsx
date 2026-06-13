import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pwt-primary-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-pwt-primary text-pwt-background shadow-sm hover:bg-pwt-primary/85',
        secondary: 'bg-pwt-surface-muted text-pwt-primary hover:bg-pwt-primary-soft',
        accent: 'bg-pwt-accent-soft text-pwt-warning hover:bg-pwt-accent hover:text-pwt-background',
        outline: 'border border-pwt-border bg-pwt-surface text-pwt-primary hover:bg-pwt-primary-soft',
        ghost: 'text-pwt-muted hover:bg-pwt-surface-muted hover:text-pwt-primary',
      },
      size: {
        default: 'px-4 py-2.5',
        sm: 'min-h-10 px-3 py-2 text-sm',
        lg: 'min-h-12 px-5 py-3 text-base',
        icon: 'size-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
