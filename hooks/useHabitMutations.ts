import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createHabit, updateHabit, setHabitArchived, deleteHabit, type HabitInput } from "@/lib/queries/habits";
import { mapSupabaseError } from "@/lib/supabase/errors";

function useInvalidateHabits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["habits"] });
}

export function useCreateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: (input: HabitInput) => createHabit(createClient(), input),
    onSuccess: () => {
      invalidate();
      toast.success("Habitude créée");
    },
    onError: (error) => toast.error("Échec de la création", { description: mapSupabaseError(error) }),
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<HabitInput> }) =>
      updateHabit(createClient(), id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Habitude mise à jour");
    },
    onError: (error) => toast.error("Échec de la mise à jour", { description: mapSupabaseError(error) }),
  });
}

export function useSetHabitArchived() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setHabitArchived(createClient(), id, archived),
    onSuccess: invalidate,
    onError: (error) => toast.error("Échec de l'archivage", { description: mapSupabaseError(error) }),
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: (id: string) => deleteHabit(createClient(), id),
    onSuccess: () => {
      invalidate();
      toast.success("Habitude supprimée");
    },
    onError: (error) => toast.error("Échec de la suppression", { description: mapSupabaseError(error) }),
  });
}
