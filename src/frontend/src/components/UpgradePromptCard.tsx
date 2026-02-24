import { Crown, Sparkles, TrendingUp, BarChart3, Download, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UpgradePromptCardProps {
  onUpgrade: () => void;
  habitCount: number;
  habitLimit: number;
}

export function UpgradePromptCard({ onUpgrade, habitCount, habitLimit }: UpgradePromptCardProps) {
  const remaining = habitLimit - habitCount;
  
  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="mt-1">
              {remaining > 0 
                ? `${remaining} habit${remaining === 1 ? "" : "s"} remaining on free plan`
                : "You've reached your free plan limit"
              }
            </CardDescription>
          </div>
          <Sparkles className="h-6 w-6 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span>Unlimited habits</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span>Advanced analytics & insights</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4 text-amber-500" />
            <span>Export your data</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4 text-amber-500" />
            <span>Categories & custom goals</span>
          </div>
        </div>
        
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          onClick={onUpgrade}
        >
          <Crown className="mr-2 h-5 w-5" />
          Unlock Premium Features
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Starting at just $4.99/month • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
