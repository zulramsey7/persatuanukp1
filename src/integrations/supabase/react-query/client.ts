import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep inactive data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus for faster UX
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Set query timeout to 30 seconds
      networkMode: "always",
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
