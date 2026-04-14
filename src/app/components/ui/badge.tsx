import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-teal-100 text-teal-800',
        secondary: 'border-slate-200 bg-slate-100 text-slate-700',
        destructive: 'border-transparent bg-red-100 text-red-700',
        outline: 'border-slate-200 text-slate-700 bg-transparent',
        critical: 'border-transparent bg-coral-light text-coral',
        high: 'border-transparent bg-gold-light text-gold-dark',
        medium: 'border-transparent bg-teal-light text-teal',
        low: 'border-slate-200 bg-slate-100 text-slate-600',
        info: 'border-slate-100 bg-slate-50 text-slate-500',
        success: 'border-transparent bg-emerald-100 text-emerald-700',
        warning: 'border-transparent bg-amber-100 text-amber-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
