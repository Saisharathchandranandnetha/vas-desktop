'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '@/lib/ipc-client';

// ─── Query Keys ───

export const queryKeys = {
  providers: ['providers'] as const,
  models: ['models'] as const,
  agents: ['agents'] as const,
  mcpServers: ['mcp-servers'] as const,
  gatewayStatus: ['gateway-status'] as const,
  obsStats: ['observability-stats'] as const,
  obsRecent: ['observability-recent'] as const,
  appVersion: ['app-version'] as const,
  appPlatform: ['app-platform'] as const,
} as const;

// ─── Provider Hooks ───

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: () => ipc.providers.list(),
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ipc.providers.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.providers });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ipc.providers.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.providers });
    },
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: (id: string) => ipc.providers.test(id),
  });
}

// ─── Model Hooks ───

export function useModels() {
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: () => ipc.models.list(),
  });
}

// ─── Agent Hooks ───

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => ipc.agents.list(),
  });
}

export function useStartAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ipc.agents.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useStopAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ipc.agents.stop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useRestartAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ipc.agents.restart(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useDetectAgents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.agents.detect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

// ─── MCP Hooks ───

export function useMcpServers() {
  return useQuery({
    queryKey: queryKeys.mcpServers,
    queryFn: () => ipc.mcp.list(),
  });
}

export function useStartMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ipc.mcp.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers });
    },
  });
}

export function useStopMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ipc.mcp.stop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers });
    },
  });
}

// ─── Gateway Hooks ───

export function useGatewayStatus() {
  return useQuery({
    queryKey: queryKeys.gatewayStatus,
    queryFn: () => ipc.gateway.status(),
    refetchInterval: 10_000, // Poll every 10 seconds
  });
}

// ─── Observability Hooks ───

export function useObservabilityStats() {
  return useQuery({
    queryKey: queryKeys.obsStats,
    queryFn: () => ipc.observability.stats(),
    refetchInterval: 5_000,
  });
}

export function useRecentRequests(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.obsRecent, limit],
    queryFn: () => ipc.observability.recent(limit),
    refetchInterval: 3_000,
  });
}

// ─── App Info Hooks ───

export function useAppVersion() {
  return useQuery({
    queryKey: queryKeys.appVersion,
    queryFn: () => ipc.app.version(),
    staleTime: Infinity,
  });
}

export function useAppPlatform() {
  return useQuery({
    queryKey: queryKeys.appPlatform,
    queryFn: () => ipc.app.platform(),
    staleTime: Infinity,
  });
}
