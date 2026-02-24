import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Zap, PartyPopper } from "lucide-react";
import type { StreakRewardType } from "../backend.d";

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardType: StreakRewardType | null;
  streakDays: number;
}

export function CelebrationModal({
  open,
  onOpenChange,
  rewardType,
  streakDays,
}: CelebrationModalProps) {
  if (!rewardType) return null;

  const isMonthReward = rewardType === "oneMonthPremium";
  const rewardDuration = isMonthReward ? "1 Month" : "1 Year";
  const milestoneDay = isMonthReward ? 150 : 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/10 to-secondary/10 pointer-events-none" />
        
        <div className="relative animate-bounce-in">
          <DialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-success rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-r from-primary to-success p-6 rounded-full">
                  <Trophy className="h-16 w-16 text-white animate-celebrate" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Milestone Achieved!
              </Badge>

              <DialogTitle className="text-3xl font-bold tracking-tight">
                {streakDays} Day Streak! 🎉
              </DialogTitle>

              <DialogDescription className="text-base">
                Incredible dedication! You've maintained consistency for{" "}
                <span className="font-semibold text-foreground">{milestoneDay} days</span>.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="bg-card border-2 border-primary/20 rounded-xl p-6 space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Your Reward</h3>
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-success px-4 py-2 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-lg">
                    {rewardDuration} Premium Access
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Enjoy all premium features at no cost!
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span>Unlimited habits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span>Advanced analytics dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span>Data export & goal tracking</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white border-0"
              size="lg"
            >
              Continue Your Journey
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Keep going! Every day of consistency counts.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
