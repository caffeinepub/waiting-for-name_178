import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";
import type { Habit } from "../backend.d";

interface HabitHistoryProps {
  habit: Habit;
  completionDates: bigint[];
}

export function HabitHistory({ habit, completionDates }: HabitHistoryProps) {
  // Generate last 30 days calendar
  const calendar = useMemo(() => {
    const days: Array<{ date: Date; isCompleted: boolean; isToday: boolean }> = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateNanos = BigInt(date.getTime()) * 1_000_000n;
      const isCompleted = completionDates.some((completionDate) => {
        const compDate = new Date(Number(completionDate) / 1_000_000);
        compDate.setHours(0, 0, 0, 0);
        return compDate.getTime() === date.getTime();
      });
      
      days.push({
        date,
        isCompleted,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return days;
  }, [completionDates]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompletions = completionDates.length;
    const currentStreak = Number(habit.streakCount);
    
    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    
    const sortedDates = [...completionDates]
      .map((d) => Number(d) / 1_000_000)
      .sort((a, b) => a - b);
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    
    // Last 7 days completion rate
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7DaysCompletions = completionDates.filter(
      (d) => Number(d) / 1_000_000 >= sevenDaysAgo
    ).length;
    const weeklyRate = Math.round((last7DaysCompletions / 7) * 100);
    
    return {
      totalCompletions,
      currentStreak,
      bestStreak,
      weeklyRate,
    };
  }, [completionDates, habit.streakCount]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>History & Stats</CardTitle>
        </div>
        <CardDescription>Track your consistency over time</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Total Completions</p>
            <p className="text-2xl font-bold">{stats.totalCompletions}</p>
          </div>
          
          <div className="space-y-1 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Best Streak</p>
            <p className="text-2xl font-bold">{stats.bestStreak} days</p>
          </div>
          
          <div className="space-y-1 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{stats.currentStreak} days</p>
          </div>
          
          <div className="space-y-1 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Weekly Rate</p>
            <p className="text-2xl font-bold">{stats.weeklyRate}%</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          <h3 className="mb-3 text-sm font-medium">Last 30 Days</h3>
          <div className="grid grid-cols-10 gap-1.5">
            {calendar.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-md transition-all ${
                  day.isCompleted
                    ? "bg-success shadow-sm"
                    : day.isToday
                    ? "border-2 border-primary"
                    : "bg-muted/30"
                }`}
                title={day.date.toLocaleDateString()}
              />
            ))}
          </div>
          
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-success" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border-2 border-primary" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-muted/30" />
              <span>Missed</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {stats.weeklyRate >= 70 && (
          <Badge variant="secondary" className="w-fit">
            <TrendingUp className="mr-1.5 h-3 w-3" />
            Great momentum this week!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
