'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useProviders, useDeleteProvider, useTestProvider } from '@/hooks/use-ipc';
import { cn } from '@/lib/utils';
import {
  Blocks,
  Plus,
  FlaskConical,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { ProviderType } from '@vas/shared';

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
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
} as const;

const providerIcons: Record<string, string> = {
  openai: '🟢',
  anthropic: '🟠',
  gemini: '🔵',
  openai_compat: '⚡',
  custom: '🔧',
};

function ProviderCard({
  provider,
  onTest,
  onDelete,
}: {
  provider: {
    id: string;
    name: string;
    type: ProviderType;
    baseUrl: string;
    status: string;
    modelsCount: number;
    isEnabled: boolean;
  };
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);
  const testMutation = useTestProvider();

  const handleTest = async () => {
    setTestResult(null);
    const result = await testMutation.mutateAsync(provider.id);
    setTestResult(result);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group rounded-xl border border-border-default bg-bg-secondary p-5 transition-colors hover:border-border-focus/30 hover:bg-bg-tertiary"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{providerIcons[provider.type] ?? '⚡'}</span>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{provider.name}</h3>
            <p className="text-xs text-text-tertiary font-mono truncate max-w-[200px]">
              {provider.baseUrl}
            </p>
          </div>
        </div>
        <StatusBadge
          status={provider.status as 'healthy' | 'degraded' | 'down' | 'unknown'}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
        <span className="capitalize">{provider.type.replace('_', ' ')}</span>
        <span className="text-border-default">·</span>
        <span>{provider.modelsCount} models</span>
        <span className="text-border-default">·</span>
        <span className={provider.isEnabled ? 'text-success' : 'text-text-tertiary'}>
          {provider.isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs mb-3',
            testResult.success
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error',
          )}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {testResult.success
            ? `Connected — ${testResult.latencyMs}ms`
            : `Failed — ${testResult.error ?? 'Connection error'}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-active hover:text-text-primary disabled:opacity-50"
        >
          {testMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FlaskConical className="h-3 w-3" />
          )}
          Test
        </button>
        <button
          onClick={() => onTest(provider.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-active hover:text-text-primary"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => onDelete(provider.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-error/20 hover:text-error"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

export default function ProvidersPage() {
  const { data: providers, isLoading } = useProviders();
  const deleteMutation = useDeleteProvider();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('Delete this provider? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Shell
      title="Providers"
      subtitle={`${providers?.length ?? 0} configured`}
      headerActions={
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Provider
        </button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : providers && providers.length > 0 ? (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onTest={() => {}}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Blocks}
          title="No providers configured"
          description="Connect your first AI provider to start routing requests through VAS."
          action={{
            label: 'Add Provider',
            onClick: () => setShowAddModal(true),
          }}
        />
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <AddProviderModal onClose={() => setShowAddModal(false)} />
      )}
    </Shell>
  );
}

function AddProviderModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProviderType>('openai');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');

  const providerTypes: { value: ProviderType; label: string }[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openai_compat', label: 'OpenAI Compatible' },
    { value: 'custom', label: 'Custom' },
  ];

  const urlDefaults: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    openai_compat: 'http://localhost:11434/v1',
    custom: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md rounded-2xl border border-border-default bg-bg-primary p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-text-primary">Add Provider</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My OpenAI"
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => {
                const t = e.target.value as ProviderType;
                setType(t);
                setBaseUrl(urlDefaults[t] ?? '');
              }}
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary transition-colors focus:border-border-focus focus:outline-none"
            >
              {providerTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            disabled={!name || !baseUrl}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Provider
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
