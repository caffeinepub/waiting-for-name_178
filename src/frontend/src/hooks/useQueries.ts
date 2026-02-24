import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Habit, HabitEntryInput, HabitId, UserStateView, PaymentRecord, SubscriptionTier, ShoppingItem, StreakRewardStatus, StreakReward } from "../backend.d";
import type { Principal } from "@icp-sdk/core/principal";

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

export function useGetSubscriptionDetails() {
  const { actor, isFetching } = useActor();
  return useQuery<UserStateView | null>({
    queryKey: ["subscription-details"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMySubscriptionDetails();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPaymentHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentRecord[]>({
    queryKey: ["payment-history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPaymentHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsPremiumUser() {
  const { actor, isFetching } = useActor();
  const { data: identity } = useQuery({
    queryKey: ["identity"],
    queryFn: () => null,
    enabled: false,
  });
  
  return useQuery<boolean>({
    queryKey: ["is-premium"],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.isPremiumUser(identity);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useExportHabitData() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.exportAllHabitData();
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
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
      queryClient.invalidateQueries({ queryKey: ["streak-reward-status"] });
      queryClient.invalidateQueries({ queryKey: ["active-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-details"] });
    },
  });
}

export function useGetStreakRewardStatus(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<StreakRewardStatus | null>({
    queryKey: ["streak-reward-status", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getStreakRewardStatus(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetActiveRewards(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<StreakReward[]>({
    queryKey: ["active-rewards", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getActiveRewards(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}
