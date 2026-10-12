"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { useState } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster position="top-center" dir="rtl" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
