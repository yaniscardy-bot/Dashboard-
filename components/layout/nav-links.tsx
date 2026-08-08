"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, History, TrendingUp, ListChecks, Gauge, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/history", label: "Historique", icon: History },
  { href: "/trends", label: "Tendances", icon: TrendingUp },
  { href: "/habits", label: "Habitudes", icon: ListChecks },
  { href: "/metrics", label: "Métriques", icon: Gauge },
  { href: "/settings", label: "Réglages", icon: Settings },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
