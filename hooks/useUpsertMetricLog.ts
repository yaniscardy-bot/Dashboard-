import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { upsertMetricLog } from "@/lib/queries/logs";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { metricLogsKey } from "@/hooks/useDayLogs";
import type { MetricLog } from "@/types/domain";

interface Vars {
  metricId: string;
  logDate: string;
  value: number;
}

/** Même pattern optimiste que useToggleHabitLog, pour les valeurs de métrique. */
export function useUpsertMetricLog() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: Vars) => upsertMetricLog(createClient(), vars),

    onMutate: async (vars) => {
      const key = metricLogsKey(vars.logDate, vars.logDate);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MetricLog[]>(key);

      queryClient.setQueryData<MetricLog[]>(key, (old = []) => {
        const rest = old.filter((l) => l.metricId !== vars.metricId);
        const optimistic: MetricLog = {
          id: `optimistic-${vars.metricId}-${vars.logDate}`,
          metricId: vars.metricId,
          userId: "",
          logDate: vars.logDate,
          value: vars.value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [...rest, optimistic];
      });

      return { previous, key };
    },

    onError: (error, vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
      toast.error("Échec de l'enregistrement", {
        description: mapSupabaseError(error),
        action: { label: "Réessayer", onClick: () => mutation.mutate(vars) },
      });
    },

    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: metricLogsKey(vars.logDate, vars.logDate) });
    },
  });

  return mutation;
}
