'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { EmptyState } from '@/components/shared/empty-state';
import { useModels, useProviders } from '@/hooks/use-ipc';
import { cn, formatCost, formatNumber } from '@/lib/utils';
import {
  Box,
  Search,
  Filter,
  Wrench,
  Eye,
  Radio,
  Loader2,
} from 'lucide-react';

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  },
};

export default function ModelsPage() {
  const { data: models, isLoading } = useModels();
  const { data: providers } = useProviders();
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter((model) => {
      const matchesSearch =
        !search ||
        model.name.toLowerCase().includes(search.toLowerCase()) ||
        model.id.toLowerCase().includes(search.toLowerCase());
      const matchesProvider =
        providerFilter === 'all' || model.providerId === providerFilter;
      return matchesSearch && matchesProvider;
    });
  }, [models, search, providerFilter]);

  return (
    <Shell
      title="Models"
      subtitle={`${filteredModels.length} available`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="space-y-5"
      >
        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full rounded-lg border border-border-default bg-bg-secondary pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-lg border border-border-default bg-bg-secondary pl-8 pr-8 py-2 text-sm text-text-primary appearance-none cursor-pointer transition-colors focus:border-border-focus focus:outline-none"
            >
              <option value="all">All Providers</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Models Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : filteredModels.length > 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border-default px-5 py-3">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Model
              </span>
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Provider
              </span>
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                Context
              </span>
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                Cost (in/out)
              </span>
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-center">
                Capabilities
              </span>
            </div>

            {/* Table Rows */}
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              className="divide-y divide-border-subtle"
            >
              {filteredModels.map((model) => (
                <motion.div
                  key={model.id}
                  variants={stagger.item}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 transition-colors hover:bg-bg-hover items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {model.name}
                    </p>
                    <p className="text-xs text-text-tertiary font-mono truncate">
                      {model.id}
                    </p>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {model.providerName}
                  </span>
                  <span className="text-sm text-text-secondary font-mono text-right">
                    {formatNumber(model.contextWindow)}
                  </span>
                  <span className="text-sm text-text-secondary font-mono text-right">
                    {model.inputCostPer1k === 0
                      ? 'Free'
                      : `${formatCost(model.inputCostPer1k)} / ${formatCost(model.outputCostPer1k)}`}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {model.supportsTools && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted"
                        title="Function Calling"
                      >
                        <Wrench className="h-3 w-3 text-accent" />
                      </div>
                    )}
                    {model.supportsVision && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted"
                        title="Vision"
                      >
                        <Eye className="h-3 w-3 text-accent" />
                      </div>
                    )}
                    {model.supportsStreaming && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted"
                        title="Streaming"
                      >
                        <Radio className="h-3 w-3 text-accent" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <EmptyState
            icon={Box}
            title="No models found"
            description={
              search || providerFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Add a provider to discover available models.'
            }
          />
        )}
      </motion.div>
    </Shell>
  );
}
