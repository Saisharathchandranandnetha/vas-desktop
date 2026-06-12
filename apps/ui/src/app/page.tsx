'use client';

import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { StatCard } from '@/components/shared/stat-card';
import {
  useProviders,
  useModels,
  useAgents,
  useGatewayStatus,
  useRecentRequests,
} from '@/hooks/use-ipc';
import {
  Blocks,
  Box,
  Bot,
  Radio,
  ArrowUpRight,
  Clock,
  Zap,
  Settings,
  BarChart3,
  Plug,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatLatency, formatCost } from '@/lib/utils';

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  },
};

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickActions: QuickAction[] = [
  {
    label: 'Add Provider',
    description: 'Connect an AI provider',
    href: '/providers',
    icon: Blocks,
  },
  {
    label: 'Manage Agents',
    description: 'Start or configure agents',
    href: '/agents',
    icon: Bot,
  },
  {
    label: 'MCP Servers',
    description: 'Add tool servers',
    href: '/mcp',
    icon: Plug,
  },
  {
    label: 'View Metrics',
    description: 'Request analytics',
    href: '/observability',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    description: 'Configure gateway',
    href: '/settings',
    icon: Settings,
  },
];

export default function HomePage() {
  const { data: providers } = useProviders();
  const { data: models } = useModels();
  const { data: agents } = useAgents();
  const { data: gateway } = useGatewayStatus();
  const { data: recentRequests } = useRecentRequests(10);

  const runningAgents = agents?.filter((a) => a.status === 'running').length ?? 0;
  const healthyProviders = providers?.filter((p) => p.status === 'healthy').length ?? 0;

  return (
    <Shell title="Dashboard" subtitle="Overview">
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Blocks}
              label="Providers"
              value={providers?.length ?? 0}
              subtitle={`${healthyProviders} healthy`}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Box}
              label="Models"
              value={models?.length ?? 0}
              subtitle="Available"
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Bot}
              label="Agents"
              value={agents?.length ?? 0}
              subtitle={`${runningAgents} running`}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Radio}
              label="Gateway"
              value={gateway?.status === 'running' ? 'Active' : 'Offline'}
              subtitle={gateway ? `:${gateway.port}` : ''}
            />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={stagger.item}>
          <h2 className="text-sm font-medium text-text-secondary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="group flex items-center gap-3 rounded-xl border border-border-default bg-bg-secondary p-4 transition-colors hover:border-border-focus/30 hover:bg-bg-tertiary"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary transition-colors group-hover:bg-accent-muted">
                    <action.icon className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      {action.label}
                      <ArrowUpRight className="h-3 w-3 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                    </p>
                    <p className="text-xs text-text-tertiary truncate">{action.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Recent Activity</h2>
            <Link
              href="/observability"
              className="text-xs text-text-tertiary hover:text-accent transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
            {recentRequests && recentRequests.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {recentRequests.map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg-hover"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        req.status === 200 ? 'bg-success' : 'bg-error',
                      )} />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {req.model}
                      </span>
                      <span className="text-xs text-text-tertiary hidden sm:inline">
                        {req.providerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-text-secondary font-mono">
                        {req.totalTokens.toLocaleString()} tok
                      </span>
                      <span className="text-xs text-text-tertiary font-mono w-14 text-right">
                        {formatLatency(req.latencyMs)}
                      </span>
                      <span className="text-xs text-text-secondary font-mono w-16 text-right">
                        {formatCost(req.estimatedCost)}
                      </span>
                      <Clock className="h-3 w-3 text-text-tertiary" />
                      <span className="text-xs text-text-tertiary w-12 text-right">
                        {Math.round((Date.now() - req.timestamp) / 1000)}s ago
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-8 w-8 text-text-tertiary mb-3" />
                <p className="text-sm text-text-secondary">No recent activity</p>
                <p className="text-xs text-text-tertiary mt-1">
                  Requests through the gateway will appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Shell>
  );
}
