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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Plus, Moon, Sun, TrendingUp } from "lucide-react";
import { HabitCard } from "./components/HabitCard";
import { HabitFormDialog } from "./components/HabitFormDialog";
import { HabitHistory } from "./components/HabitHistory";
import {
  useGetAllHabitsWithStreaks,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCompleteHabit,
} from "./hooks/useQueries";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { playCompletionSound, scheduleReminder, requestNotificationPermission } from "./utils/audio";
import type { Habit, HabitEntryInput, HabitId } from "./backend.d";

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
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<HabitId | null>(null);
  const [historyHabit, setHistoryHabit] = useState<{
    habit: Habit;
    completionDates: bigint[];
  } | null>(null);

  const { data: habitsWithStreaks, isLoading } = useGetAllHabitsWithStreaks();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const completeHabit = useCompleteHabit();

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
    completeHabit.mutate(habitId, {
      onSuccess: () => {
        if (soundEnabled) {
          playCompletionSound();
        }
        toast.success("Great job! Keep it up!");
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
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">StreakMaster</h1>
            <p className="text-sm text-muted-foreground">
              {habitsWithStreaks?.length || 0} habits tracked
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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

      <main className="container mx-auto px-4 py-6">
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
            <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </ScrollArea>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => {
            setEditingHabit(null);
            setFormOpen(true);
          }}
          className="h-16 w-16 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

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
            <div className="mt-6">
              <HabitHistory
                habit={historyHabit.habit}
                completionDates={historyHabit.completionDates}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

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
