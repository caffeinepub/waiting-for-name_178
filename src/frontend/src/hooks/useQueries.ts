import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Habit, HabitEntryInput, HabitId } from "../backend.d";

export function useGetAllHabitsWithStreaks() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Habit, bigint[]]>>({
    queryKey: ["habits-with-streaks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHabitsWithStreaks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetHabitWithStats(habitId: HabitId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<[Habit, bigint[]] | null>({
    queryKey: ["habit-stats", habitId?.toString()],
    queryFn: async () => {
      if (!actor || !habitId) return null;
      return actor.getHabitWithStats(habitId);
    },
    enabled: !!actor && !isFetching && habitId !== null,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (habitData: HabitEntryInput) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createHabit(habitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits-with-streaks"] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      habitId,
      update,
    }: {
      habitId: HabitId;
      update: HabitEntryInput;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateHabit(habitId, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits-with-streaks"] });
      queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (habitId: HabitId) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits-with-streaks"] });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (habitId: HabitId) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.completeHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits-with-streaks"] });
      queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    },
  });
}
