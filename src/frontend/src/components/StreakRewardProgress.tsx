import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles } from "lucide-react";

interface StreakRewardProgressProps {
  currentStreak: number;
  nextMilestone: number;
  rewardType: "1 Month Premium" | "1 Year Premium";
}

export function StreakRewardProgress({
  currentStreak,
  nextMilestone,
  rewardType,
}: StreakRewardProgressProps) {
  const progress = Math.min((currentStreak / nextMilestone) * 100, 100);
  const daysRemaining = Math.max(0, nextMilestone - currentStreak);

  if (daysRemaining === 0) {
    return null; // Milestone reached, handled by celebration modal
  }

  return (
    <div className="space-y-2 p-3 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border border-primary/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span>Reward Progress</span>
        </div>
        <Badge variant="outline" className="bg-background/80 text-xs px-2 py-0.5">
          <Sparkles className="mr-1 h-2.5 w-2.5" />
          {rewardType}
        </Badge>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-1.5 bg-muted" />
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-semibold text-foreground">{daysRemaining} days</span> until{" "}
          {rewardType === "1 Month Premium" ? "1 month" : "1 year"} free premium
        </p>
      </div>
    </div>
  );
}
