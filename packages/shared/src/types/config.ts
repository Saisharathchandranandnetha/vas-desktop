// ─── Configuration Types ───

export interface VasConfig {
  gateway: GatewayConfig;
  ui: UiConfig;
  updates: UpdateConfig;
}

export interface GatewayConfig {
  port: number;
  host: string;
  rateLimit: {
    enabled: boolean;
    maxRequestsPerMinute: number;
  };
  auth: {
    enabled: boolean;
    token?: string;
  };
}

export interface UiConfig {
  theme: 'dark' | 'light' | 'system';
  sidebarCollapsed: boolean;
  language: string;
}

export interface UpdateConfig {
  channel: 'stable' | 'beta' | 'nightly';
  autoUpdate: boolean;
  checkInterval: number; // minutes
}

export const DEFAULT_CONFIG: VasConfig = {
  gateway: {
    port: 16324,
    host: '127.0.0.1',
    rateLimit: {
      enabled: true,
      maxRequestsPerMinute: 200,
    },
    auth: {
      enabled: false,
    },
  },
  ui: {
    theme: 'dark',
    sidebarCollapsed: false,
    language: 'en',
  },
  updates: {
    channel: 'stable',
    autoUpdate: true,
    checkInterval: 60,
  },
};
