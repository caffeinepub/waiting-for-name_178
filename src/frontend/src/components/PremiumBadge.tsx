import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumBadgeProps {
  variant?: "default" | "compact";
  label?: string;
}

export function PremiumBadge({ variant = "default", label }: PremiumBadgeProps) {
  const displayLabel = label || (variant === "compact" ? "PRO" : "Premium");
  
  if (variant === "compact") {
    return (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
        <Crown className="h-3 w-3 mr-1" />
        {displayLabel}
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1">
      <Crown className="h-4 w-4 mr-1.5" />
      {displayLabel}
    </Badge>
  );
}
