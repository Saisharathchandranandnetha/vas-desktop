import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds — local backend is fast
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
