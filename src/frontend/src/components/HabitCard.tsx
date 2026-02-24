import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Flame, MoreVertical, Pencil, Trash2, Volume2, VolumeX } from "lucide-react";
import type { Habit } from "../backend.d";

interface HabitCardProps {
  habit: Habit;
  completionDates: bigint[];
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isCompleting?: boolean;
}

export function HabitCard({
  habit,
  completionDates,
  onComplete,
  onEdit,
  onDelete,
  isCompleting = false,
}: HabitCardProps) {
  const [showRipple, setShowRipple] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const streak = Number(habit.streakCount);
  const targetFreq = Number(habit.targetFrequency);
  const completionPercent = Math.min((completionDates.length / targetFreq) * 100, 100);

  // Check if completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNanos = BigInt(today.getTime()) * 1_000_000n;
  
  const completedToday = completionDates.some((date) => {
    const completionDate = new Date(Number(date) / 1_000_000);
    completionDate.setHours(0, 0, 0, 0);
    return completionDate.getTime() === today.getTime();
  });

  const handleComplete = () => {
    if (completedToday) return;
    
    setShowRipple(true);
    setIsCelebrating(true);
    
    setTimeout(() => setShowRipple(false), 600);
    setTimeout(() => setIsCelebrating(false), 500);
    
    onComplete();
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold tracking-tight truncate">
              {habit.name}
            </CardTitle>
            {habit.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {habit.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {habit.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Streak Display */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 ${isCelebrating ? "animate-celebrate" : ""}`}>
            <Flame
              className={`h-6 w-6 ${
                streak > 0 ? "text-primary fill-primary" : "text-muted-foreground"
              }`}
            />
            <span className="text-3xl font-bold tracking-tight">{streak}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">day streak</div>
            {completionDates.length > 0 && (
              <div className="text-xs">
                {completionDates.length} completions
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(completionPercent)}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Check-in Button */}
        <Button
          onClick={handleComplete}
          disabled={completedToday || isCompleting}
          className={`w-full touch-target relative overflow-hidden ${
            completedToday ? "bg-success hover:bg-success" : ""
          }`}
          size="lg"
        >
          {showRipple && (
            <span className="absolute inset-0 bg-success animate-ripple rounded-lg" />
          )}
          <Check className="mr-2 h-5 w-5" />
          {completedToday ? "Completed Today!" : "Complete"}
        </Button>

        {/* Reminder Badge */}
        {habit.reminderTime && (
          <Badge variant="outline" className="w-fit">
            Reminder:{" "}
            {new Date(Number(habit.reminderTime) / 1_000_000).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            )}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
