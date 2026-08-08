"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { parseDateKey, toDateKey } from "@/lib/calculations/date-utils";

export function DayNav() {
  const selectedDate = useUIStore((s) => s.selectedDate);
  const shiftSelectedDate = useUIStore((s) => s.shiftSelectedDate);
  const goToToday = useUIStore((s) => s.goToToday);

  const date = parseDateKey(selectedDate);
  const isToday = selectedDate === toDateKey(new Date());

  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-card p-3">
      <Button variant="outline" size="icon" onClick={() => shiftSelectedDate(-1)} aria-label="Jour précédent">
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-52 text-center">
        <p className="font-sans text-sm font-medium capitalize">{label}</p>
        {!isToday && (
          <button onClick={goToToday} className="text-xs text-primary hover:underline">
            Revenir à aujourd&apos;hui
          </button>
        )}
      </div>
      <Button variant="outline" size="icon" onClick={() => shiftSelectedDate(1)} aria-label="Jour suivant">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
