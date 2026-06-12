'use client';

import { cn } from '@/lib/utils';

type StatusType =
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unknown'
  | 'running'
  | 'stopped'
  | 'error'
  | 'starting';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; bg: string; label: string }> = {
  healthy: {
    color: 'bg-success',
    bg: 'bg-success/10 text-success',
    label: 'Healthy',
  },
  running: {
    color: 'bg-success',
    bg: 'bg-success/10 text-success',
    label: 'Running',
  },
  degraded: {
    color: 'bg-warning',
    bg: 'bg-warning/10 text-warning',
    label: 'Degraded',
  },
  starting: {
    color: 'bg-warning',
    bg: 'bg-warning/10 text-warning',
    label: 'Starting',
  },
  down: {
    color: 'bg-error',
    bg: 'bg-error/10 text-error',
    label: 'Down',
  },
  error: {
    color: 'bg-error',
    bg: 'bg-error/10 text-error',
    label: 'Error',
  },
  stopped: {
    color: 'bg-text-tertiary',
    bg: 'bg-white/5 text-text-secondary',
    label: 'Stopped',
  },
  unknown: {
    color: 'bg-text-tertiary',
    bg: 'bg-white/5 text-text-secondary',
    label: 'Unknown',
  },
};

export function StatusBadge({ status, size = 'md', showLabel = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isPulsing = status === 'running' || status === 'healthy' || status === 'starting';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.bg,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isPulsing && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.color,
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            config.color,
          )}
        />
      </span>
      {showLabel && config.label}
    </span>
  );
}
