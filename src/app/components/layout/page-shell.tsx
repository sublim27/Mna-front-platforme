import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function PageShell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('page-shell page-stack', className)}>{children}</div>;
}

export function PageHero({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('page-hero', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
