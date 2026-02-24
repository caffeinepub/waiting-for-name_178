import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureLockProps {
  featureName: string;
  description: string;
  onUpgrade: () => void;
}

export function FeatureLock({ featureName, description, onUpgrade }: FeatureLockProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm z-10" />
      
      <CardHeader className="relative z-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <CardTitle>{featureName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-20 text-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          onClick={onUpgrade}
        >
          <Crown className="mr-2 h-5 w-5" />
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}
