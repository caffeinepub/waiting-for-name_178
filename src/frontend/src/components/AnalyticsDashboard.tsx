import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Calendar, Award } from "lucide-react";
import type { Habit } from "@/backend.d";

interface AnalyticsDashboardProps {
  habits: Array<[Habit, bigint[]]>;
}

export function AnalyticsDashboard({ habits }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, [_, dates]) => sum + dates.length, 0);
    const bestStreak = Math.max(...habits.map(([h]) => Number(h.streakCount)), 0);
    
    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentCompletions = habits.reduce((sum, [habit, dates]) => {
      const recentDates = dates.filter(d => Number(d) / 1_000_000 > thirtyDaysAgo);
      return sum + recentDates.length;
    }, 0);
    
    const expectedCompletions = totalHabits * 30;
    const completionRate = expectedCompletions > 0 ? (recentCompletions / expectedCompletions) * 100 : 0;

    // Find most consistent habit (highest streak)
    const mostConsistent = habits.reduce<[Habit, bigint[]] | null>((best, current) => {
      if (!best || Number(current[0].streakCount) > Number(best[0].streakCount)) {
        return current;
      }
      return best;
    }, null);

    // Calculate average streak
    const avgStreak = totalHabits > 0
      ? habits.reduce((sum, [h]) => sum + Number(h.streakCount), 0) / totalHabits
      : 0;

    return {
      totalHabits,
      totalCompletions,
      bestStreak,
      completionRate,
      mostConsistent,
      avgStreak,
      recentCompletions,
    };
  }, [habits]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Deep insights into your consistency journey
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalHabits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actively tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.bestStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">
              consecutive days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalCompletions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.avgStreak.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              days per habit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Completion Rate</CardTitle>
          <CardDescription>
            You completed {analytics.recentCompletions} out of {analytics.totalHabits * 30} possible check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Completion Rate</span>
              <span className="font-bold">{analytics.completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.completionRate} className="h-3" />
          </div>
          
          {analytics.completionRate >= 80 && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
              🎉 Excellent consistency! You're in the top tier!
            </div>
          )}
          
          {analytics.completionRate >= 60 && analytics.completionRate < 80 && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-600 dark:text-blue-400">
              💪 Great progress! Keep pushing toward 80%!
            </div>
          )}
          
          {analytics.completionRate < 60 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-600 dark:text-amber-400">
              🎯 There's room to grow! Small steps lead to big changes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Consistent Habit */}
      {analytics.mostConsistent && (
        <Card>
          <CardHeader>
            <CardTitle>Most Consistent Habit</CardTitle>
            <CardDescription>Your longest running streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-semibold text-lg">{analytics.mostConsistent[0].name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.mostConsistent[0].description || "No description"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {Number(analytics.mostConsistent[0].streakCount)}
                </div>
                <div className="text-sm text-muted-foreground">days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Habit Performance</CardTitle>
          <CardDescription>Individual streak breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habits
              .sort((a, b) => Number(b[0].streakCount) - Number(a[0].streakCount))
              .map(([habit, dates]) => (
                <div key={habit.id.toString()} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{habit.name}</span>
                    <span className="text-muted-foreground">
                      {Number(habit.streakCount)} day streak • {dates.length} total
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((Number(habit.streakCount) / 30) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
