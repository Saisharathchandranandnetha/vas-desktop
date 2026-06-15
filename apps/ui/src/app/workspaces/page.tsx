'use client';

import { motion } from 'motion/react';
import { Shell } from '@/components/layout/shell';
import { EmptyState } from '@/components/shared/empty-state';
import { FolderOpen, Plus } from 'lucide-react';

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

export default function WorkspacesPage() {
  return (
    <Shell
      title="Workspaces"
      subtitle="Project contexts"
      headerActions={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover">
          <Plus className="h-3.5 w-3.5" />
          Add Workspace
        </button>
      }
    >
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={stagger.item}>
          <EmptyState
            icon={FolderOpen}
            title="No workspaces configured"
            description="Workspaces let you scope providers, routing rules, and MCP servers to specific projects."
            action={{
              label: 'Create Workspace',
              onClick: () => {},
            }}
          />
        </motion.div>
      </motion.div>
    </Shell>
  );
}
