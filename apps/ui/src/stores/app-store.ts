import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  activeWorkspaceId: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveWorkspace: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  activeWorkspaceId: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setActiveWorkspace: (id) =>
    set({ activeWorkspaceId: id }),
}));
