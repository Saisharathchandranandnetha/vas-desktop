'use client';

import { Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';
import { useGatewayStatus, useAppPlatform } from '@/hooks/use-ipc';
import { ipc } from '@/lib/ipc-client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { data: gateway } = useGatewayStatus();
  const { data: platform } = useAppPlatform();
  const isWindows = platform === 'win32';

  return (
    <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-bg-primary/80 backdrop-blur-sm px-6 drag-region">
      {/* Left: Page title */}
      <div className="flex items-center gap-3 no-drag">
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        {subtitle && (
          <span className="text-xs text-text-tertiary">{subtitle}</span>
        )}
      </div>

      {/* Right: Status + Actions + Window controls */}
      <div className="flex items-center gap-3 no-drag">
        {/* Gateway status */}
        {gateway && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <StatusBadge
              status={gateway.status === 'running' ? 'healthy' : 'down'}
              size="sm"
              showLabel={false}
            />
            <span className="font-mono text-[11px]">
              Gateway :{gateway.port}
            </span>
          </div>
        )}

        {/* Custom actions */}
        {actions && (
          <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
            {actions}
          </div>
        )}

        {/* Window controls (Windows only) */}
        {isWindows && (
          <div className="flex items-center gap-0.5 border-l border-border-subtle pl-3 ml-1">
            <button
              onClick={() => ipc.window.minimize()}
              className={cn(
                'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                'text-text-tertiary hover:bg-bg-hover hover:text-text-secondary',
              )}
              aria-label="Minimize"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => ipc.window.maximize()}
              className={cn(
                'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                'text-text-tertiary hover:bg-bg-hover hover:text-text-secondary',
              )}
              aria-label="Maximize"
            >
              <Square className="h-3 w-3" />
            </button>
            <button
              onClick={() => ipc.window.close()}
              className={cn(
                'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                'text-text-tertiary hover:bg-error/20 hover:text-error',
              )}
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
