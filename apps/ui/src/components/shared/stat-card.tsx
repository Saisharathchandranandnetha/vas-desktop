'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, trend, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-5',
        'transition-colors hover:border-border-focus/30 hover:bg-bg-tertiary',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">
          <Icon className="h-4.5 w-4.5 text-accent" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium rounded-md px-1.5 py-0.5',
              trend.positive
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error',
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{label}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
        )}
      </div>

      {/* Subtle gradient highlight on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
