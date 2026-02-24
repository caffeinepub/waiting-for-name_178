import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Plus, Moon, Sun, TrendingUp, Crown, BarChart3, Settings, Sparkles, Trophy } from "lucide-react";
import { HabitCard } from "./components/HabitCard";
import { HabitFormDialog } from "./components/HabitFormDialog";
import { HabitHistory } from "./components/HabitHistory";
import { HabitGoals } from "./components/HabitGoals";
import { PremiumBadge } from "./components/PremiumBadge";
import { UpgradeModal } from "./components/UpgradeModal";
import { UpgradePromptCard } from "./components/UpgradePromptCard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { SubscriptionManagement } from "./components/SubscriptionManagement";
import { DataExport } from "./components/DataExport";
import { FeatureLock } from "./components/FeatureLock";
import { CelebrationModal } from "./components/CelebrationModal";
import { RewardsSection } from "./components/RewardsSection";
import {
  useGetAllHabitsWithStreaks,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCompleteHabit,
  useGetSubscriptionDetails,
  useGetPaymentHistory,
  useGetStreakRewardStatus,
  useGetActiveRewards,
} from "./hooks/useQueries";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { playCompletionSound, scheduleReminder, requestNotificationPermission } from "./utils/audio";
import type { Habit, HabitEntryInput, HabitId, StreakRewardType } from "./backend.d";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [formOpen, setFormOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<HabitId | null>(null);
  const [historyHabit, setHistoryHabit] = useState<{
    habit: Habit;
    completionDates: bigint[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState("habits");
  const [celebrationModal, setCelebrationModal] = useState<{
    open: boolean;
    rewardType: StreakRewardType | null;
    streakDays: number;
  }>({
    open: false,
    rewardType: null,
    streakDays: 0,
  });

  const { data: habitsWithStreaks, isLoading } = useGetAllHabitsWithStreaks();
  const { data: subscriptionData } = useGetSubscriptionDetails();
  const { data: paymentHistory } = useGetPaymentHistory();
  const principal = identity?.getPrincipal() || null;
  const { data: rewardStatus } = useGetStreakRewardStatus(principal);
  const { data: activeRewards } = useGetActiveRewards(principal);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const completeHabit = useCompleteHabit();

  const habitCount = habitsWithStreaks?.length || 0;
  const hasActiveReward = (activeRewards?.length || 0) > 0;
  const isPremium = hasActiveReward || (subscriptionData && (
    subscriptionData.subscription === "premium_monthly" ||
    subscriptionData.subscription === "premium_yearly"
  ));
  const isFree = !isPremium;
  const FREE_HABIT_LIMIT = 3;

  // Check for checkout success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    
    if (checkoutStatus === "success") {
      toast.success("Welcome to Premium! 🎉", {
        description: "Your subscription is now active. Enjoy unlimited habits!",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelled", {
        description: "You can upgrade anytime from the settings.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (habitsWithStreaks) {
      const timeouts: NodeJS.Timeout[] = [];
      
      habitsWithStreaks.forEach(([habit, _]) => {
        if (habit.reminderTime && habit.soundEnabled) {
          const timeout = scheduleReminder(
            habit.name,
            Number(habit.reminderTime),
            habit.soundEnabled,
            () => {
              toast.info(`Reminder: ${habit.name}`, {
                description: "Time to keep your streak going!",
              });
            }
          );
          if (timeout) timeouts.push(timeout);
        }
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [habitsWithStreaks]);

  const handleCreateHabit = (data: HabitEntryInput) => {
    // Check habit limit for free users
    if (isFree && !editingHabit && habitCount >= FREE_HABIT_LIMIT) {
      setFormOpen(false);
      setUpgradeModalOpen(true);
      toast.error("Free plan limit reached", {
        description: `You can only create ${FREE_HABIT_LIMIT} habits on the free plan.`,
      });
      return;
    }

    if (editingHabit) {
      updateHabit.mutate(
        { habitId: editingHabit.id, update: data },
        {
          onSuccess: () => {
            toast.success("Habit updated successfully!");
            setFormOpen(false);
            setEditingHabit(null);
          },
          onError: () => {
            toast.error("Failed to update habit");
          },
        }
      );
    } else {
      createHabit.mutate(data, {
        onSuccess: () => {
          toast.success("Habit created successfully!");
          setFormOpen(false);
        },
        onError: () => {
          toast.error("Failed to create habit");
        },
      });
    }
  };

  const handleDeleteHabit = () => {
    if (!deleteHabitId) return;

    deleteHabit.mutate(deleteHabitId, {
      onSuccess: () => {
        toast.success("Habit deleted");
        setDeleteHabitId(null);
      },
      onError: () => {
        toast.error("Failed to delete habit");
      },
    });
  };

  const handleCompleteHabit = (habitId: HabitId, soundEnabled: boolean) => {
    // Store current active rewards count before completion
    const prevActiveRewardsCount = activeRewards?.length || 0;
    
    completeHabit.mutate(habitId, {
      onSuccess: () => {
        if (soundEnabled) {
          playCompletionSound();
        }
        toast.success("Great job! Keep it up!");

        // Check for new milestone rewards after a short delay to allow backend to update
        if (principal) {
          setTimeout(() => {
            // The query will have refetched by now due to invalidation
            const newActiveRewardsCount = activeRewards?.length || 0;
            
            // New reward earned!
            if (newActiveRewardsCount > prevActiveRewardsCount && activeRewards && activeRewards.length > 0) {
              const newReward = activeRewards[0]; // Most recent reward
              setCelebrationModal({
                open: true,
                rewardType: newReward.rewardType,
                streakDays: Number(newReward.longestStreak),
              });
            }
          }, 1000);
        }
      },
      onError: () => {
        toast.error("Failed to record completion");
      },
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  if (loginStatus === "idle" || loginStatus === "logging-in") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">StreakMaster</h1>
            <p className="text-lg text-muted-foreground">
              Build consistency, one day at a time
            </p>
          </div>
          <Button
            size="lg"
            className="w-full touch-target"
            onClick={login}
            disabled={loginStatus === "logging-in"}
          >
            {loginStatus === "logging-in" ? "Connecting..." : "Get Started"}
          </Button>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">StreakMaster</h1>
              <p className="text-sm text-muted-foreground">
                {habitCount} habit{habitCount !== 1 ? "s" : ""} tracked
                {isFree && ` • ${FREE_HABIT_LIMIT - habitCount} remaining`}
              </p>
            </div>
            {isPremium && (
              <PremiumBadge 
                variant="compact"
                label={hasActiveReward ? "Premium (Reward)" : undefined}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isFree && (
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                onClick={() => setUpgradeModalOpen(true)}
              >
                <Crown className="mr-1.5 h-4 w-4" />
                Upgrade
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="touch-target"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={clear}
              className="touch-target"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="habits" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
              {isFree && <Sparkles className="h-3 w-3 text-amber-500" />}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Trophy className="h-4 w-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : !habitsWithStreaks || habitsWithStreaks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold">No habits yet</h2>
                <p className="mb-8 text-muted-foreground">
                  Create your first habit to start tracking consistency
                </p>
                <Button
                  size="lg"
                  onClick={() => setFormOpen(true)}
                  className="touch-target"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Habit
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 pb-4">
                  {/* Show upgrade prompt for free users */}
                  {isFree && (
                    <UpgradePromptCard
                      onUpgrade={() => setUpgradeModalOpen(true)}
                      habitCount={habitCount}
                      habitLimit={FREE_HABIT_LIMIT}
                    />
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {habitsWithStreaks.map(([habit, completionDates]) => (
                      <div key={habit.id.toString()}>
                        <HabitCard
                          habit={habit}
                          completionDates={completionDates}
                          onComplete={() => handleCompleteHabit(habit.id, habit.soundEnabled)}
                          onEdit={() => {
                            setEditingHabit(habit);
                            setFormOpen(true);
                          }}
                          onDelete={() => setDeleteHabitId(habit.id)}
                          isCompleting={completeHabit.isPending}
                          nextMilestone={rewardStatus?.nextMilestone}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => setHistoryHabit({ habit, completionDates })}
                        >
                          View History
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {isFree ? (
              <FeatureLock
                featureName="Advanced Analytics"
                description="Get deep insights into your habits with completion rates, trends, and personalized recommendations."
                onUpgrade={() => setUpgradeModalOpen(true)}
              />
            ) : habitsWithStreaks && habitsWithStreaks.length > 0 ? (
              <AnalyticsDashboard habits={habitsWithStreaks} />
            ) : (
              <div className="text-center py-16">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No data yet</h3>
                <p className="text-muted-foreground">
                  Create some habits and start tracking to see your analytics
                </p>
              </div>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <RewardsSection rewardStatus={rewardStatus || null} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <SubscriptionManagement
              subscriptionData={subscriptionData || null}
              paymentHistory={paymentHistory || []}
              onUpgrade={() => setUpgradeModalOpen(true)}
            />
            
            {isPremium && <DataExport />}
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => {
            if (isFree && habitCount >= FREE_HABIT_LIMIT) {
              setUpgradeModalOpen(true);
              toast.info("Upgrade to create more habits", {
                description: `Free plan is limited to ${FREE_HABIT_LIMIT} habits.`,
              });
            } else {
              setEditingHabit(null);
              setFormOpen(true);
            }
          }}
          className="h-16 w-16 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan={subscriptionData?.subscription}
      />

      <HabitFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingHabit(null);
        }}
        onSubmit={editingHabit ? handleCreateHabit : handleCreateHabit}
        habit={editingHabit || undefined}
        isSubmitting={createHabit.isPending || updateHabit.isPending}
      />

      <AlertDialog
        open={deleteHabitId !== null}
        onOpenChange={(open) => !open && setDeleteHabitId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this habit and all its history. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHabit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={historyHabit !== null}
        onOpenChange={(open) => !open && setHistoryHabit(null)}
      >
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{historyHabit?.habit.name}</SheetTitle>
            <SheetDescription>
              View your progress and statistics
            </SheetDescription>
          </SheetHeader>
          {historyHabit && (
            <div className="mt-6 space-y-6">
              <HabitHistory
                habit={historyHabit.habit}
                completionDates={historyHabit.completionDates}
              />
              
              {isPremium && (
                <HabitGoals habit={historyHabit.habit} />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CelebrationModal
        open={celebrationModal.open}
        onOpenChange={(open) =>
          setCelebrationModal({ ...celebrationModal, open })
        }
        rewardType={celebrationModal.rewardType}
        streakDays={celebrationModal.streakDays}
      />

      <footer className="border-t bg-muted/30 py-6 text-center text-sm text-muted-foreground">
        <p>
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster position="top-center" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
