'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Home,
  Bot,
  Blocks,
  Box,
  Plug,
  BarChart3,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/providers', label: 'Providers', icon: Blocks },
  { href: '/models', label: 'Models', icon: Box },
  { href: '/mcp', label: 'MCP', icon: Plug },
  { href: '/observability', label: 'Observability', icon: BarChart3 },
  { href: '/workspaces', label: 'Workspaces', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-default bg-bg-primary"
    >
      {/* Logo Area */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-border-subtle">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted">
          <Zap className="h-4 w-4 text-accent" />
        </div>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold tracking-tight text-text-primary whitespace-nowrap"
            >
              VAS Desktop
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                sidebarCollapsed && 'justify-center px-2',
                isActive
                  ? 'bg-bg-active text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors',
                  isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary',
                )}
              />

              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 hidden rounded-md bg-bg-tertiary border border-border-default px-2.5 py-1 text-xs text-text-primary shadow-lg group-hover:block z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border-subtle p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary focus-ring"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
