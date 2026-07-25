import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { APP_NAME } from "@/shared/constants/app";
import { Sidebar } from "@/widgets/layout/sidebar/sidebar";
import { Topbar } from "@/widgets/layout/topbar/topbar";

/** Product shell: a fixed dark sidebar on desktop (a `Sheet` drawer on
 * mobile), the topbar, and a scrollable content outlet. Mounted inside
 * `AuthGuard` for every protected route. */
export function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        <div className="fixed h-dvh w-64">
          <Sidebar />
        </div>
      </aside>

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent
          side="left"
          className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground sm:max-w-72"
        >
          <SheetTitle className="sr-only">{APP_NAME}</SheetTitle>
          <Sidebar onNavigate={() => setIsNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setIsNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
