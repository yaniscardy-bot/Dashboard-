"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageTransition } from "@/components/layout/page-transition";
import { LogoutButton } from "@/components/layout/logout-button";

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold font-sans">Habit Tracker</div>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-2 px-2 pt-4 text-xs text-muted-foreground">
          <span className="truncate">{userEmail}</span>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:justify-end">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <ThemeToggle />
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-4">
            <VisuallyHidden>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden>
            <div className="mb-6 px-2 text-lg font-semibold font-sans">Habit Tracker</div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
