'use client';

import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useAgents,
  useStartAgent,
  useStopAgent,
  useRestartAgent,
  useDetectAgents,
} from '@/hooks/use-ipc';
import { cn, formatUptime } from '@/lib/utils';
import {
  Bot,
  Play,
  Square,
  RotateCcw,
  Search,
  Loader2,
} from 'lucide-react';

const agentIcons: Record<string, string> = {
  claude_code: '🤖',
  codex: '⚡',
  aider: '🔧',
  gemini_cli: '💎',
  opencode: '📝',
  continue: '➡️',
  cline: '🔗',
  custom: '🧩',
};

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  },
  item: {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  },
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const startAgent = useStartAgent();
  const stopAgent = useStopAgent();
  const restartAgent = useRestartAgent();
  const detectAgents = useDetectAgents();

  const runningCount = agents?.filter((a) => a.status === 'running').length ?? 0;

  return (
    <Shell
      title="Agents"
      subtitle={`${runningCount} running`}
      headerActions={
        <button
          onClick={() => detectAgents.mutate()}
          disabled={detectAgents.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {detectAgents.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Detect Agents
        </button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : agents && agents.length > 0 ? (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={stagger.item}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="group rounded-xl border border-border-default bg-bg-secondary p-5 transition-colors hover:border-border-focus/30 hover:bg-bg-tertiary"
            >
              {/* Agent header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agentIcons[agent.type] ?? '🧩'}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{agent.name}</h3>
                    <p className="text-xs text-text-tertiary capitalize">
                      {agent.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={agent.status as 'running' | 'stopped' | 'error' | 'starting'}
                  size="sm"
                />
              </div>

              {/* Agent details */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">Version</p>
                  <p className="text-sm text-text-secondary font-mono">{agent.version}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">Status</p>
                  <p className={cn(
                    'text-sm font-medium capitalize',
                    agent.status === 'running' ? 'text-success' : 'text-text-secondary',
                  )}>
                    {agent.status}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">Uptime</p>
                  <p className="text-sm text-text-secondary font-mono">
                    {agent.status === 'running' ? formatUptime(agent.uptime) : '—'}
                  </p>
                </div>
              </div>

              {/* PID indicator */}
              {agent.pid && (
                <div className="text-xs text-text-tertiary font-mono mb-3">
                  PID {agent.pid}
                </div>
              )}

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                {agent.status === 'running' ? (
                  <>
                    <button
                      onClick={() => stopAgent.mutate(agent.id)}
                      disabled={stopAgent.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      <Square className="h-3 w-3" />
                      Stop
                    </button>
                    <button
                      onClick={() => restartAgent.mutate(agent.id)}
                      disabled={restartAgent.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-active hover:text-text-primary disabled:opacity-50"
                    >
                      {restartAgent.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Restart
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startAgent.mutate(agent.id)}
                    disabled={startAgent.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                  >
                    {startAgent.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Start
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Bot}
          title="No agents detected"
          description="Click 'Detect Agents' to scan for installed coding agents like Claude Code, Aider, and Codex."
          action={{
            label: 'Detect Agents',
            onClick: () => detectAgents.mutate(),
          }}
        />
      )}
    </Shell>
  );
}
