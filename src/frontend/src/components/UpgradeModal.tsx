import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateCheckoutSession } from "@/hooks/useQueries";
import type { ShoppingItem, SubscriptionTier } from "@/backend.d";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: SubscriptionTier;
}

const PREMIUM_FEATURES = [
  "Unlimited habits",
  "Advanced analytics & insights",
  "Export data (CSV/JSON)",
  "Habit categories & tags",
  "Custom goals & milestones",
  "Priority support",
];

export function UpgradeModal({ open, onOpenChange, currentPlan }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const createCheckout = useCreateCheckoutSession();

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    const item: ShoppingItem = {
      productName: plan === "monthly" ? "StreakMaster Premium Monthly" : "StreakMaster Premium Yearly",
      productDescription: plan === "monthly" 
        ? "Premium subscription - billed monthly"
        : "Premium subscription - billed yearly (save $10!)",
      priceInCents: BigInt(plan === "monthly" ? 499 : 4999),
      currency: "USD",
      quantity: BigInt(1),
    };

    const successUrl = `${window.location.origin}?checkout=success`;
    const cancelUrl = `${window.location.origin}?checkout=cancelled`;

    try {
      const sessionUrl = await createCheckout.mutateAsync({
        items: [item],
        successUrl,
        cancelUrl,
      });
      
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Crown className="h-6 w-6 text-amber-500" />
            <DialogTitle className="text-3xl">Upgrade to Premium</DialogTitle>
          </div>
          <DialogDescription className="text-center text-base">
            Unlock unlimited habits and powerful features to master your consistency
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 my-6">
          {/* Monthly Plan */}
          <div
            className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
              selectedPlan === "monthly"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">Monthly</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <Button
                className="w-full"
                variant={selectedPlan === "monthly" ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade("monthly");
                }}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Choose Monthly"
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                Billed monthly • Cancel anytime
              </p>
            </div>
          </div>

          {/* Yearly Plan */}
          <div
            className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
              selectedPlan === "yearly"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              BEST VALUE
            </Badge>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">Yearly</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$49.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                  Save $10 per year!
                </p>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade("yearly");
                }}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Choose Yearly"
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                Billed annually • Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h4 className="font-semibold mb-4 text-center">Everything in Premium:</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Secure payment powered by Stripe • Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  );
}
