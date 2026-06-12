'use client';

import { motion } from 'motion/react';
import { useAppStore } from '@/stores/app-store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { useGatewayStatus, useAppVersion } from '@/hooks/use-ipc';

interface ShellProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function Shell({ title, subtitle, headerActions, children }: ShellProps) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const { data: gateway } = useGatewayStatus();
  const { data: version } = useAppVersion();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />

      {/* Main content area */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-1 flex-col min-w-0"
      >
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Status bar */}
        <footer className="flex h-7 items-center justify-between border-t border-border-subtle bg-bg-primary px-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-tertiary font-mono">
              v{version ?? '...'}
            </span>
            {gateway && (
              <>
                <span className="text-border-default">·</span>
                <span className={cn(
                  'flex items-center gap-1 text-[11px] font-mono',
                  gateway.status === 'running' ? 'text-success' : 'text-error',
                )}>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    gateway.status === 'running' ? 'bg-success' : 'bg-error',
                  )} />
                  {gateway.status === 'running' ? 'Connected' : 'Disconnected'}
                </span>
                <span className="text-border-default">·</span>
                <span className="text-[11px] text-text-tertiary font-mono">
                  {gateway.requestsTotal.toLocaleString()} requests
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-text-tertiary">VAS Desktop</span>
        </footer>
      </motion.div>
    </div>
  );
}
