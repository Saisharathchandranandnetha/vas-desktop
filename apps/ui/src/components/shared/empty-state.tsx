'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-secondary border border-border-default mb-4">
        <Icon className="h-6 w-6 text-text-tertiary" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1.5">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-5">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover focus-ring"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
