import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { upsertHabitLog } from "@/lib/queries/logs";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { habitLogsKey } from "@/hooks/useDayLogs";
import type { HabitLog } from "@/types/domain";

interface Vars {
  habitId: string;
  logDate: string;
  completed: boolean;
}

/**
 * Bascule l'état d'une habitude pour un jour donné, avec mise à jour
 * optimiste immédiate du cache et retour en arrière + toast en cas
 * d'échec (jamais d'échec silencieux). Implémentation de référence du
 * pattern de mutation optimiste, repris à l'identique par useUpsertMetricLog.
 */
export function useToggleHabitLog() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: Vars) => upsertHabitLog(createClient(), vars),

    onMutate: async (vars) => {
      const key = habitLogsKey(vars.logDate, vars.logDate);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HabitLog[]>(key);

      queryClient.setQueryData<HabitLog[]>(key, (old = []) => {
        const rest = old.filter((l) => l.habitId !== vars.habitId);
        const optimistic: HabitLog = {
          id: `optimistic-${vars.habitId}-${vars.logDate}`,
          habitId: vars.habitId,
          userId: "",
          logDate: vars.logDate,
          completed: vars.completed,
          note: null,
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
      queryClient.invalidateQueries({ queryKey: habitLogsKey(vars.logDate, vars.logDate) });
    },
  });

  return mutation;
}
