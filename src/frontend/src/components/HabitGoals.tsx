import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "@/hooks/useActor";
import { toast } from "sonner";
import type { Habit, HabitId } from "@/backend.d";

interface HabitGoalsProps {
  habit: Habit;
}

export function HabitGoals({ habit }: HabitGoalsProps) {
  const [newGoal, setNewGoal] = useState("");
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: goal, isLoading } = useQuery<string | null>({
    queryKey: ["habit-goal", habit.id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHabitGoal(habit.id);
    },
    enabled: !!actor,
  });

  const addGoal = useMutation({
    mutationFn: async (goalText: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addHabitGoal(habit.id, goalText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-goal", habit.id.toString()] });
      setNewGoal("");
      toast.success("Goal set successfully!");
    },
    onError: () => {
      toast.error("Failed to set goal");
    },
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim()) {
      addGoal.mutate(newGoal.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <CardTitle>Goal</CardTitle>
        </div>
        <CardDescription>Set a milestone or target for this habit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : goal ? (
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{goal}</p>
                  <Badge variant="outline" className="mt-2">
                    Current streak: {Number(habit.streakCount)} days
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleAddGoal} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="goal">
              {goal ? "Update Goal" : "Set a Goal"}
            </Label>
            <Input
              id="goal"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="e.g., Reach a 30-day streak"
              disabled={addGoal.isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={!newGoal.trim() || addGoal.isPending}
            className="w-full"
          >
            {addGoal.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                {goal ? "Update Goal" : "Set Goal"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
