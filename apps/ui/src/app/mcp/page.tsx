'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useMcpServers, useStartMcpServer, useStopMcpServer } from '@/hooks/use-ipc';
import {
  Plug,
  Plus,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Wrench,
  Terminal,
  Loader2,
} from 'lucide-react';

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  },
} as const;

function McpServerCard({
  server,
}: {
  server: {
    id: string;
    name: string;
    displayName: string;
    status: 'running' | 'stopped' | 'error' | 'starting';
    transport: string;
    toolsCount: number;
    command: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const startServer = useStartMcpServer();
  const stopServer = useStopMcpServer();

  const isRunning = server.status === 'running';

  return (
    <motion.div
      variants={stagger.item}
      className="rounded-xl border border-border-default bg-bg-secondary transition-colors hover:border-border-focus/30"
    >
      {/* Main row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary">
            <Plug className="h-4 w-4 text-text-tertiary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{server.displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-tertiary font-mono">{server.name}</span>
              <span className="text-border-default">·</span>
              <span className="text-xs text-text-secondary uppercase tracking-wider">
                {server.transport}
              </span>
              <span className="text-border-default">·</span>
              <span className="text-xs text-text-secondary">
                {server.toolsCount} tools
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge
            status={server.status as 'running' | 'stopped' | 'error' | 'starting'}
            size="sm"
          />

          {isRunning ? (
            <button
              onClick={() => stopServer.mutate(server.id)}
              disabled={stopServer.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
            >
              {stopServer.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              Stop
            </button>
          ) : (
            <button
              onClick={() => startServer.mutate(server.id)}
              disabled={startServer.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
            >
              {startServer.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Start
            </button>
          )}

          {/* Expand/collapse button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tool inspector (expanded) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle px-4 py-3 space-y-3">
              {/* Command */}
              <div>
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                  Command
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-bg-primary px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                  <code className="text-xs text-text-secondary font-mono truncate">
                    {server.command}
                  </code>
                </div>
              </div>

              {/* Tools preview */}
              <div>
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                  Tools ({server.toolsCount})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(server.toolsCount, 8) }, (_, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-bg-primary px-2 py-1 text-xs text-text-secondary"
                    >
                      <Wrench className="h-3 w-3 text-text-tertiary" />
                      tool_{i + 1}
                    </span>
                  ))}
                  {server.toolsCount > 8 && (
                    <span className="inline-flex items-center rounded-md bg-bg-primary px-2 py-1 text-xs text-text-tertiary">
                      +{server.toolsCount - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function McpPage() {
  const { data: servers, isLoading } = useMcpServers();

  const runningCount = servers?.filter((s) => s.status === 'running').length ?? 0;

  return (
    <Shell
      title="MCP Servers"
      subtitle={`${runningCount} running`}
      headerActions={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover">
          <Plus className="h-3.5 w-3.5" />
          Add Server
        </button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : servers && servers.length > 0 ? (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {servers.map((server) => (
            <McpServerCard key={server.id} server={server} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Plug}
          title="No MCP servers configured"
          description="Add MCP servers to give your agents access to tools like filesystem, databases, and APIs."
          action={{
            label: 'Add MCP Server',
            onClick: () => {},
          }}
        />
      )}
    </Shell>
  );
}
