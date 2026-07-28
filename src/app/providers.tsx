import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/shared/components/ui/sonner";
import { QueryProvider } from "@/app/providers/query-provider";

interface AppProvidersProps {
  children: ReactNode;
}

/** App-wide, route-independent providers: the TanStack Query client, theme
 * (light/dark via `.dark` on root), and the toast host. Locale is provided
 * per `/:lang` match inside the router (see `LocaleRoot` in
 * `src/app/app.tsx`), not here. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  );
}
