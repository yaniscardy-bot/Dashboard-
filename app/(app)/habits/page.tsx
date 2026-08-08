"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { useCreateHabit, useSetHabitArchived, useDeleteHabit } from "@/hooks/useHabitMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composed/empty-state";
import { listContainerVariants, listItemVariants } from "@/lib/motion/tokens";
import type { FrequencyType } from "@/types/domain";

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export default function HabitsPage() {
  const habitsQuery = useHabits();
  const createHabit = useCreateHabit();
  const setArchived = useSetHabitArchived();
  const deleteHabit = useDeleteHabit();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([]);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createHabit.mutate(
      {
        name: name.trim(),
        icon: icon.trim() || null,
        frequencyType,
        frequencyTarget: frequencyType === "weekly_count" ? weeklyTarget : null,
        frequencyWeekdays: frequencyType === "specific_weekdays" ? weekdays : null,
      },
      {
        onSuccess: () => {
          setName("");
          setIcon("");
          setWeekdays([]);
        },
      }
    );
  }

  const active = (habitsQuery.data ?? []).filter((h) => !h.archived);
  const archived = (habitsQuery.data ?? []).filter((h) => h.archived);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-sans text-xl font-semibold">Habitudes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle habitude</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-16 shrink-0 space-y-1.5">
                <Label htmlFor="icon">Icône</Label>
                <Input id="icon" maxLength={2} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="◆" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sport" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fréquence</Label>
              <Select value={frequencyType} onValueChange={(v) => setFrequencyType(v as FrequencyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Tous les jours</SelectItem>
                  <SelectItem value="weekly_count">X fois par semaine</SelectItem>
                  <SelectItem value="specific_weekdays">Jours précis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequencyType === "weekly_count" && (
              <div className="space-y-1.5">
                <Label htmlFor="target">Fois par semaine</Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  max={7}
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            )}

            {frequencyType === "specific_weekdays" && (
              <div className="space-y-1.5">
                <Label>Jours</Label>
                <div className="flex gap-1.5">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleWeekday(i)}
                      className={`flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                        weekdays.includes(i)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={createHabit.isPending} className="self-start">
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        {habitsQuery.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState icon={ListChecks} title="Aucune habitude active" description="Créez votre première habitude ci-dessus." />
        ) : (
          <motion.ul variants={listContainerVariants} initial="initial" animate="animate" className="space-y-2">
            {active.map((habit) => (
              <motion.li
                key={habit.id}
                variants={listItemVariants}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-lg">{habit.icon || "◆"}</span>
                <span className="flex-1 text-sm font-medium">{habit.name}</span>
                <span className="text-xs text-muted-foreground">
                  {habit.frequencyType === "daily"
                    ? "Quotidien"
                    : habit.frequencyType === "weekly_count"
                      ? `${habit.frequencyTarget}x/semaine`
                      : "Jours précis"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchived.mutate({ id: habit.id, archived: true })}
                  aria-label="Archiver"
                >
                  <Archive className="size-4" />
                </Button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Archivées</h2>
          <ul className="space-y-2">
            {archived.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 opacity-70"
              >
                <span className="text-lg">{habit.icon || "◆"}</span>
                <span className="flex-1 text-sm">{habit.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchived.mutate({ id: habit.id, archived: false })}
                  aria-label="Désarchiver"
                >
                  <ArchiveRestore className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteHabit.mutate(habit.id)} aria-label="Supprimer">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
