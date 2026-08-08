"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { useCreateMetric, useSetMetricArchived, useDeleteMetric } from "@/hooks/useMetricMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composed/empty-state";
import { listContainerVariants, listItemVariants } from "@/lib/motion/tokens";
import type { TargetDirection } from "@/types/domain";

export default function MetricsPage() {
  const metricsQuery = useMetrics();
  const createMetric = useCreateMetric();
  const setArchived = useSetMetricArchived();
  const deleteMetric = useDeleteMetric();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<TargetDirection>("at_least");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) return;
    createMetric.mutate(
      {
        name: name.trim(),
        icon: icon.trim() || null,
        unit: unit.trim(),
        targetValue: target === "" ? null : Number(target),
        targetDirection: target === "" ? null : direction,
      },
      {
        onSuccess: () => {
          setName("");
          setIcon("");
          setUnit("");
          setTarget("");
        },
      }
    );
  }

  const active = (metricsQuery.data ?? []).filter((m) => !m.archived);
  const archived = (metricsQuery.data ?? []).filter((m) => m.archived);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-sans text-xl font-semibold">Métriques</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle métrique</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-16 shrink-0 space-y-1.5">
                <Label htmlFor="m-icon">Icône</Label>
                <Input id="m-icon" maxLength={2} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="◆" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="m-name">Nom</Label>
                <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sommeil" required />
              </div>
              <div className="w-24 shrink-0 space-y-1.5">
                <Label htmlFor="m-unit">Unité</Label>
                <Input id="m-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="h" required />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="m-target">Cible (optionnel)</Label>
                <Input
                  id="m-target"
                  type="number"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="7.5"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Sens</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as TargetDirection)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at_least">Au moins (≥)</SelectItem>
                    <SelectItem value="at_most">Au plus (≤)</SelectItem>
                    <SelectItem value="exact">Exactement (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={createMetric.isPending} className="self-start">
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        {metricsQuery.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState icon={Gauge} title="Aucune métrique active" description="Créez votre première métrique ci-dessus." />
        ) : (
          <motion.ul variants={listContainerVariants} initial="initial" animate="animate" className="space-y-2">
            {active.map((metric) => (
              <motion.li
                key={metric.id}
                variants={listItemVariants}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-lg">{metric.icon || "◆"}</span>
                <span className="flex-1 text-sm font-medium">{metric.name}</span>
                <span className="text-xs text-muted-foreground">
                  {metric.targetValue !== null
                    ? `Cible ${metric.targetDirection === "at_most" ? "≤" : metric.targetDirection === "exact" ? "=" : "≥"} ${metric.targetValue}${metric.unit}`
                    : metric.unit}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchived.mutate({ id: metric.id, archived: true })}
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
            {archived.map((metric) => (
              <li
                key={metric.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 opacity-70"
              >
                <span className="text-lg">{metric.icon || "◆"}</span>
                <span className="flex-1 text-sm">{metric.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchived.mutate({ id: metric.id, archived: false })}
                  aria-label="Désarchiver"
                >
                  <ArchiveRestore className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMetric.mutate(metric.id)} aria-label="Supprimer">
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
