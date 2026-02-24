import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, TrendingUp, Award, Sparkles, Clock } from "lucide-react";
import type { StreakRewardStatus } from "../backend.d";

interface RewardsSectionProps {
  rewardStatus: StreakRewardStatus | null;
}

export function RewardsSection({ rewardStatus }: RewardsSectionProps) {
  if (!rewardStatus) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Streak Rewards</CardTitle>
          </div>
          <CardDescription>
            Earn free premium access by maintaining long streaks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete habits daily to build streaks and unlock rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { activeRewards, rewardHistory, currentStreak, longestStreak, nextMilestone } = rewardStatus;
  const hasActiveReward = activeRewards.length > 0;

  return (
    <div className="space-y-4">
      {/* Active Rewards */}
      {hasActiveReward && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-success/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Active Rewards</CardTitle>
            </div>
            <CardDescription>
              Your earned premium access from consistency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRewards.map((reward, index) => {
              const earnedDate = new Date(Number(reward.earnedDate) / 1_000_000);
              const expirationDate = new Date(Number(reward.expirationDate) / 1_000_000);
              const daysRemaining = Math.ceil(
                (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isMonthReward = reward.rewardType === "oneMonthPremium";

              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">
                          {isMonthReward ? "1 Month" : "1 Year"} Premium
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Earned for {Number(reward.longestStreak)} day streak
                      </p>
                    </div>
                    <Badge className="bg-success text-success-foreground">
                      Active
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Earned: {earnedDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {daysRemaining > 0
                          ? `Expires in ${daysRemaining} days`
                          : "Expires today"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Progress to Next Milestone */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Next Milestone</CardTitle>
          </div>
          <CardDescription>Keep your streak going to unlock rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{Number(currentStreak)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold">{Number(longestStreak)}</p>
            </div>
          </div>

          {nextMilestone ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to{" "}
                  {nextMilestone.rewardType === "oneMonthPremium"
                    ? "1 Month Premium"
                    : "1 Year Premium"}
                </span>
                <span className="font-medium">
                  {Number(currentStreak)}/{Number(nextMilestone.milestoneDays)}
                </span>
              </div>
              <Progress
                value={(Number(currentStreak) / Number(nextMilestone.milestoneDays)) * 100}
                className="h-2.5"
              />
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-semibold text-foreground">
                  {Number(nextMilestone.milestoneDays) - Number(currentStreak)} days
                </span>{" "}
                remaining
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-success">
                <Award className="h-5 w-5" />
                <span className="font-semibold">All milestones unlocked!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Keep building your streak to maintain your rewards
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward History */}
      {rewardHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Reward History</CardTitle>
            </div>
            <CardDescription>Your past earned rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rewardHistory.map((reward, index) => {
                const earnedDate = new Date(Number(reward.earnedDate) / 1_000_000);
                const isMonthReward = reward.rewardType === "oneMonthPremium";
                const isActive = reward.isActive;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isMonthReward ? "1 Month" : "1 Year"} Premium
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(reward.longestStreak)} day streak •{" "}
                          {earnedDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Expired"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone Info */}
      <Card className="bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">How Streak Rewards Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
              150
            </div>
            <div>
              <p className="font-medium">150 Day Streak</p>
              <p className="text-muted-foreground text-xs">
                Earn 1 month of premium access for free
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold text-xs shrink-0">
              1000
            </div>
            <div>
              <p className="font-medium">1000 Day Streak</p>
              <p className="text-muted-foreground text-xs">
                Earn 1 year of premium access for free
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
