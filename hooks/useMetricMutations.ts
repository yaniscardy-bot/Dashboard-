import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createMetric, updateMetric, setMetricArchived, deleteMetric, type MetricInput } from "@/lib/queries/metrics";
import { mapSupabaseError } from "@/lib/supabase/errors";

function useInvalidateMetrics() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["metrics"] });
}

export function useCreateMetric() {
  const invalidate = useInvalidateMetrics();
  return useMutation({
    mutationFn: (input: MetricInput) => createMetric(createClient(), input),
    onSuccess: () => {
      invalidate();
      toast.success("Métrique créée");
    },
    onError: (error) => toast.error("Échec de la création", { description: mapSupabaseError(error) }),
  });
}

export function useUpdateMetric() {
  const invalidate = useInvalidateMetrics();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MetricInput> }) =>
      updateMetric(createClient(), id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Métrique mise à jour");
    },
    onError: (error) => toast.error("Échec de la mise à jour", { description: mapSupabaseError(error) }),
  });
}

export function useSetMetricArchived() {
  const invalidate = useInvalidateMetrics();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setMetricArchived(createClient(), id, archived),
    onSuccess: invalidate,
    onError: (error) => toast.error("Échec de l'archivage", { description: mapSupabaseError(error) }),
  });
}

export function useDeleteMetric() {
  const invalidate = useInvalidateMetrics();
  return useMutation({
    mutationFn: (id: string) => deleteMetric(createClient(), id),
    onSuccess: () => {
      invalidate();
      toast.success("Métrique supprimée");
    },
    onError: (error) => toast.error("Échec de la suppression", { description: mapSupabaseError(error) }),
  });
}
