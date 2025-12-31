import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QUERY_CONSTANTS } from "@/shared/lib/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: QUERY_CONSTANTS.RETRY_COUNT,
      staleTime: QUERY_CONSTANTS.STALE_TIME_MS,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
