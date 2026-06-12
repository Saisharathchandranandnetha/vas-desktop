'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { StatCard } from '@/components/shared/stat-card';
import { useObservabilityStats, useRecentRequests } from '@/hooks/use-ipc';
import { cn, formatLatency, formatCost, formatNumber } from '@/lib/utils';
import {
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
};

// Generate time-series data from recent requests for the chart
function generateChartData(
  requests: Array<{ timestamp: number; totalTokens: number }> | undefined,
) {
  if (!requests || requests.length === 0) {
    // Generate placeholder data
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${12 - i}m`,
      requests: Math.floor(Math.random() * 20 + 5),
      tokens: Math.floor(Math.random() * 5000 + 1000),
    }));
  }

  // Group by minute buckets
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const bucketStart = now - (12 - i) * 60000;
    const bucketEnd = bucketStart + 60000;
    const inBucket = requests.filter(
      (r) => r.timestamp >= bucketStart && r.timestamp < bucketEnd,
    );
    return {
      time: `${12 - i}m`,
      requests: inBucket.length,
      tokens: inBucket.reduce((acc, r) => acc + r.totalTokens, 0),
    };
  });

  return buckets;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 shadow-xl">
      <p className="text-xs text-text-tertiary mb-1">{label} ago</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-text-primary">
          <span className="text-accent">{entry.name}:</span>{' '}
          {entry.name === 'tokens' ? formatNumber(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function ObservabilityPage() {
  const { data: stats, isLoading: statsLoading } = useObservabilityStats();
  const { data: recentRequests, isLoading: requestsLoading } = useRecentRequests(50);

  const chartData = useMemo(
    () => generateChartData(recentRequests),
    [recentRequests],
  );

  return (
    <Shell title="Observability" subtitle="Metrics & Logs">
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Activity}
              label="Total Requests"
              value={statsLoading ? '...' : formatNumber(stats?.totalRequests ?? 0)}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={Clock}
              label="Avg Latency"
              value={statsLoading ? '...' : formatLatency(stats?.avgLatencyMs ?? 0)}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={DollarSign}
              label="Total Cost"
              value={statsLoading ? '...' : formatCost(stats?.totalCost ?? 0)}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              icon={AlertTriangle}
              label="Error Rate"
              value={
                statsLoading
                  ? '...'
                  : `${((stats?.errorRate ?? 0) * 100).toFixed(1)}%`
              }
            />
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div variants={stagger.item}>
          <div className="rounded-xl border border-border-default bg-bg-secondary p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">
              Requests Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00C2FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.36)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.36)', fontSize: 11 }}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#00C2FF"
                    strokeWidth={2}
                    fill="url(#colorRequests)"
                    name="requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Request Stream */}
        <motion.div variants={stagger.item}>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Live Request Stream
          </h3>
          <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 border-b border-border-default px-5 py-2.5">
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                Model
              </span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-20 text-right">
                Tokens
              </span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-16 text-right">
                Cost
              </span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-16 text-right">
                Latency
              </span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-14 text-center">
                Status
              </span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider w-16 text-right">
                Time
              </span>
            </div>

            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
              </div>
            ) : recentRequests && recentRequests.length > 0 ? (
              <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto">
                {recentRequests.map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 transition-colors hover:bg-bg-hover items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {req.model}
                      </p>
                      <p className="text-xs text-text-tertiary">{req.providerName}</p>
                    </div>
                    <span className="text-xs text-text-secondary font-mono w-20 text-right">
                      {formatNumber(req.totalTokens)}
                    </span>
                    <span className="text-xs text-text-secondary font-mono w-16 text-right">
                      {formatCost(req.estimatedCost)}
                    </span>
                    <span className="text-xs text-text-secondary font-mono w-16 text-right">
                      {formatLatency(req.latencyMs)}
                    </span>
                    <div className="w-14 flex justify-center">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-mono',
                          req.status === 200
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error',
                        )}
                      >
                        {req.status}
                      </span>
                    </div>
                    <span className="text-xs text-text-tertiary font-mono w-16 text-right">
                      {Math.round((Date.now() - req.timestamp) / 1000)}s
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-8 w-8 text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary">No requests yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Shell>
  );
}
