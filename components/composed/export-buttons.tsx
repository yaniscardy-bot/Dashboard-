"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExportBundle } from "@/lib/actions/export";
import { toJSON } from "@/lib/export/json";
import { toCSV } from "@/lib/export/csv";
import { toDateKey } from "@/lib/calculations/date-utils";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons() {
  const [loading, setLoading] = useState<"json" | "csv" | null>(null);

  async function handleExport(format: "json" | "csv") {
    setLoading(format);
    try {
      const bundle = await getExportBundle();
      const date = toDateKey(new Date());
      if (format === "json") {
        download(`habit-tracker-${date}.json`, toJSON(bundle), "application/json");
      } else {
        download(`habit-tracker-${date}.csv`, toCSV(bundle), "text/csv");
      }
      toast.success("Export terminé");
    } catch (error) {
      toast.error("Échec de l'export", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => handleExport("json")} disabled={loading !== null}>
        <Download className="size-4" />
        {loading === "json" ? "Export…" : "Exporter en JSON"}
      </Button>
      <Button variant="outline" onClick={() => handleExport("csv")} disabled={loading !== null}>
        <Download className="size-4" />
        {loading === "csv" ? "Export…" : "Exporter en CSV"}
      </Button>
    </div>
  );
}
