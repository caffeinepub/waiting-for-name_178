import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HabitEntryInput {
    targetFrequency: bigint;
    name: string;
    description?: string;
    soundEnabled: boolean;
    reminderTime?: bigint;
    category?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PaymentRecord {
    status: string;
    userId: Principal;
    plan: SubscriptionTier;
    currency: string;
    paymentId: string;
    paymentDate: bigint;
    amount: bigint;
}
export interface StreakRewardStatus {
    rewardHistory: Array<StreakReward>;
    activeRewards: Array<StreakReward>;
    longestStreak: bigint;
    nextMilestone?: RewardMilestone;
    currentStreak: bigint;
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
    category?: string;
    streakCount: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export type UserId = Principal;
export interface StreakReward {
    earnedDate: bigint;
    isActive: boolean;
    expirationDate: bigint;
    rewardType: StreakRewardType;
    longestStreak: bigint;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface RewardMilestone {
    rewardType: StreakRewardType;
    milestoneDays: bigint;
}
export type HabitId = bigint;
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserStateView {
    subscription: SubscriptionTier;
    subscriptionEndDate?: bigint;
    stripeCustomerId?: string;
    subscriptionStartDate?: bigint;
    paymentRecords: Array<PaymentRecord>;
}
export interface UserProfile {
    name: string;
}
export enum StreakRewardType {
    oneYearPremium = "oneYearPremium",
    oneMonthPremium = "oneMonthPremium"
}
export enum SubscriptionTier {
    free = "free",
    premium_yearly = "premium_yearly",
    premium_monthly = "premium_monthly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHabitGoal(habitId: HabitId, goal: string): Promise<void>;
    addPaymentRecord(record: PaymentRecord): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeHabit(habitId: HabitId): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createHabit(habitData: HabitEntryInput): Promise<HabitId>;
    deleteHabit(habitId: HabitId): Promise<void>;
    exportAllHabitData(): Promise<Array<[Habit, Array<bigint>]>>;
    getActiveRewards(userId: Principal): Promise<Array<StreakReward>>;
    getAllHabits(): Promise<Array<Habit>>;
    getAllHabitsWithStreaks(): Promise<Array<[Habit, Array<bigint>]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHabit(habitId: HabitId): Promise<Habit>;
    getHabitGoal(habitId: HabitId): Promise<string | null>;
    getHabitWithStats(habitId: HabitId): Promise<[Habit, Array<bigint>]>;
    getMyPaymentHistory(): Promise<Array<PaymentRecord>>;
    getMySubscriptionDetails(): Promise<UserStateView | null>;
    getRecentCompletions(habitId: HabitId, days: bigint): Promise<Array<bigint>>;
    getStreakRewardStatus(userId: Principal): Promise<StreakRewardStatus>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscriptionTier(userId: Principal): Promise<SubscriptionTier>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isPremiumUser(userId: Principal): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateHabit(habitId: HabitId, update: HabitEntryInput): Promise<void>;
    updateSubscription(userId: Principal, tier: SubscriptionTier, stripeId: string | null, startDate: bigint | null, endDate: bigint | null): Promise<void>;
}
