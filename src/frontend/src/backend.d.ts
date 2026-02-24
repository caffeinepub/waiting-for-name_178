import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type HabitId = bigint;
export type UserId = Principal;
export interface HabitEntryInput {
    targetFrequency: bigint;
    name: string;
    description?: string;
    soundEnabled: boolean;
    reminderTime?: bigint;
}
export interface Habit {
    id: HabitId;
    creator: UserId;
    targetFrequency: bigint;
    name: string;
    createdAt: bigint;
    lastUpdated: bigint;
    description?: string;
    soundEnabled: boolean;
    reminderTime?: bigint;
    streakCount: bigint;
}
export interface backendInterface {
    completeHabit(habitId: HabitId): Promise<void>;
    createHabit(habitData: HabitEntryInput): Promise<HabitId>;
    deleteHabit(habitId: HabitId): Promise<void>;
    getAllHabits(): Promise<Array<Habit>>;
    getAllHabitsWithStreaks(): Promise<Array<[Habit, Array<bigint>]>>;
    getHabit(habitId: HabitId): Promise<Habit>;
    getHabitWithStats(habitId: HabitId): Promise<[Habit, Array<bigint>]>;
    getRecentCompletions(habitId: HabitId, days: bigint): Promise<Array<bigint>>;
    updateHabit(habitId: HabitId, update: HabitEntryInput): Promise<void>;
}
