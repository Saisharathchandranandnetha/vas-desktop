// ─── Window.vas IPC Bridge Type Declarations ───
// Injected by Electron preload script

import type {
  UIProvider,
  UIModel,
  UIAgent,
  UIMcpServer,
  UIGatewayStatus,
  UIObservabilityStats,
  UIRequestLog,
} from '@/lib/ipc-client';

import type { ProviderType } from '@vas/shared';

declare global {
  interface Window {
    vas: {
      providers: {
        list(): Promise<UIProvider[]>;
        create(data: {
          name: string;
          type: ProviderType;
          baseUrl: string;
          apiKey: string;
        }): Promise<UIProvider>;
        update(id: string, data: Record<string, unknown>): Promise<UIProvider>;
        delete(id: string): Promise<void>;
        test(id: string): Promise<{ success: boolean; latencyMs: number; error?: string }>;
      };
      models: {
        list(): Promise<UIModel[]>;
        search(query: string): Promise<UIModel[]>;
      };
      agents: {
        list(): Promise<UIAgent[]>;
        detect(): Promise<UIAgent[]>;
        start(id: string, options?: Record<string, unknown>): Promise<void>;
        stop(id: string): Promise<void>;
        restart(id: string): Promise<void>;
      };
      mcp: {
        list(): Promise<UIMcpServer[]>;
        install(config: Record<string, unknown>): Promise<UIMcpServer>;
        start(id: string): Promise<void>;
        stop(id: string): Promise<void>;
        inspectTools(id: string): Promise<Array<{ name: string; description: string }>>;
      };
      gateway: {
        status(): Promise<UIGatewayStatus>;
        restart(): Promise<void>;
      };
      observability: {
        stats(): Promise<UIObservabilityStats>;
        recent(limit?: number): Promise<UIRequestLog[]>;
      };
      settings: {
        get(key: string): Promise<unknown>;
        set(key: string, value: unknown): Promise<void>;
      };
      app: {
        version(): Promise<string>;
        platform(): Promise<string>;
        checkUpdates(): Promise<{ available: boolean; version?: string }>;
        quit(): void;
      };
      window: {
        minimize(): void;
        maximize(): void;
        close(): void;
      };
    };
  }
}

export {};
