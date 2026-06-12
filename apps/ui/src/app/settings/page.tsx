'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { useGatewayStatus, useAppVersion } from '@/hooks/use-ipc';
import { cn, formatUptime } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  Radio,
  Download,
  Info,
  ChevronRight,
  Check,
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
};

type UpdateChannel = 'stable' | 'beta' | 'nightly';

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={stagger.item}
      className="rounded-xl border border-border-default bg-bg-secondary p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-tertiary">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-ring',
        checked ? 'bg-accent' : 'bg-bg-active',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { data: gateway } = useGatewayStatus();
  const { data: version } = useAppVersion();
  const [updateChannel, setUpdateChannel] = useState<UpdateChannel>('stable');
  const [autoUpdate, setAutoUpdate] = useState(true);

  const channels: { value: UpdateChannel; label: string; description: string }[] = [
    { value: 'stable', label: 'Stable', description: 'Production-ready releases' },
    { value: 'beta', label: 'Beta', description: 'Preview features, minor bugs expected' },
    { value: 'nightly', label: 'Nightly', description: 'Latest changes, may be unstable' },
  ];

  return (
    <Shell title="Settings" subtitle="Configuration">
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="max-w-2xl space-y-5"
      >
        {/* General */}
        <SettingsSection
          title="General"
          description="Application preferences"
          icon={SettingsIcon}
        >
          <SettingRow label="Theme" description="VAS always uses dark mode">
            <span className="text-sm text-text-secondary">Dark</span>
          </SettingRow>
          <SettingRow label="Language">
            <span className="text-sm text-text-secondary">English</span>
          </SettingRow>
        </SettingsSection>

        {/* Gateway */}
        <SettingsSection
          title="Gateway"
          description="Local OpenAI-compatible API gateway"
          icon={Radio}
        >
          <SettingRow
            label="Gateway Port"
            description="Port the gateway listens on"
          >
            <span className="font-mono text-sm text-text-primary">
              :{gateway?.port ?? 16324}
            </span>
          </SettingRow>
          <SettingRow label="Status">
            <span
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                gateway?.status === 'running' ? 'text-success' : 'text-error',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  gateway?.status === 'running' ? 'bg-success' : 'bg-error',
                )}
              />
              {gateway?.status === 'running' ? 'Running' : 'Stopped'}
            </span>
          </SettingRow>
          {gateway?.status === 'running' && (
            <>
              <SettingRow label="Uptime">
                <span className="font-mono text-sm text-text-secondary">
                  {formatUptime(gateway.uptime)}
                </span>
              </SettingRow>
              <SettingRow label="Active Connections">
                <span className="font-mono text-sm text-text-secondary">
                  {gateway.activeConnections}
                </span>
              </SettingRow>
            </>
          )}
        </SettingsSection>

        {/* Updates */}
        <SettingsSection
          title="Updates"
          description="Update preferences and channel"
          icon={Download}
        >
          <SettingRow
            label="Auto-update"
            description="Automatically download and install updates"
          >
            <Toggle checked={autoUpdate} onChange={setAutoUpdate} />
          </SettingRow>
          <div>
            <p className="text-sm text-text-primary mb-2">Update Channel</p>
            <div className="space-y-2">
              {channels.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setUpdateChannel(ch.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                    updateChannel === ch.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border-default bg-bg-primary hover:border-border-focus/30',
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        updateChannel === ch.value
                          ? 'text-accent'
                          : 'text-text-primary',
                      )}
                    >
                      {ch.label}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {ch.description}
                    </p>
                  </div>
                  {updateChannel === ch.value && (
                    <Check className="h-4 w-4 text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          title="About"
          description="Application information"
          icon={Info}
        >
          <SettingRow label="Version">
            <span className="font-mono text-sm text-text-secondary">
              {version ?? '...'}
            </span>
          </SettingRow>
          <SettingRow label="Platform">
            <span className="text-sm text-text-secondary capitalize">Windows</span>
          </SettingRow>
          <SettingRow label="Architecture">
            <span className="text-sm text-text-secondary">x64</span>
          </SettingRow>
          <SettingRow label="Electron">
            <span className="font-mono text-sm text-text-secondary">33.x</span>
          </SettingRow>

          <div className="pt-2">
            <button className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover">
              Check for Updates
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </SettingsSection>
      </motion.div>
    </Shell>
  );
}
