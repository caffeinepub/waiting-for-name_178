import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CreditCard, Crown, AlertCircle } from "lucide-react";
import { PremiumBadge } from "./PremiumBadge";
import { toast } from "sonner";
import type { UserStateView, PaymentRecord, SubscriptionTier } from "@/backend.d";

interface SubscriptionManagementProps {
  subscriptionData: UserStateView | null;
  paymentHistory: PaymentRecord[];
  onUpgrade: () => void;
}

function formatDate(timestamp: bigint | undefined) {
  if (!timestamp) return "N/A";
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(cents: bigint, currency: string) {
  const amount = Number(cents) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case "free":
      return "Free";
    case "premium_monthly":
      return "Premium Monthly";
    case "premium_yearly":
      return "Premium Yearly";
    default:
      return "Unknown";
  }
}

export function SubscriptionManagement({
  subscriptionData,
  paymentHistory,
  onUpgrade,
}: SubscriptionManagementProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isFree = !subscriptionData || subscriptionData.subscription === "free";
  const isPremium = subscriptionData && (
    subscriptionData.subscription === "premium_monthly" ||
    subscriptionData.subscription === "premium_yearly"
  );

  const handleCancelSubscription = () => {
    // TODO: Wire up to backend cancellation endpoint when available
    toast.info("Cancellation feature coming soon!");
    setCancelDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription & Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and view payment history
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            {isPremium && <PremiumBadge />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <h3 className="text-2xl font-bold">
                {subscriptionData ? getTierDisplayName(subscriptionData.subscription) : "Free"}
              </h3>
              {isFree && (
                <p className="text-sm text-muted-foreground mt-1">
                  Limited to 3 habits
                </p>
              )}
              {isPremium && (
                <p className="text-sm text-muted-foreground mt-1">
                  Unlimited habits & premium features
                </p>
              )}
            </div>
            
            {isFree ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                onClick={onUpgrade}
              >
                <Crown className="mr-2 h-5 w-5" />
                Upgrade to Premium
              </Button>
            ) : (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {subscriptionData?.subscription === "premium_monthly" ? "$4.99" : "$49.99"}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {subscriptionData?.subscription === "premium_monthly" ? "month" : "year"}
                </div>
              </div>
            )}
          </div>

          {isPremium && subscriptionData && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Subscription Started</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(subscriptionData.subscriptionStartDate)}
                    </p>
                  </div>
                </div>

                {subscriptionData.subscriptionEndDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Next Billing Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(subscriptionData.subscriptionEndDate)}
                      </p>
                    </div>
                  </div>
                )}

                {subscriptionData.stripeCustomerId && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Customer ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {subscriptionData.stripeCustomerId}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {paymentHistory.length > 0
              ? `${paymentHistory.length} payment${paymentHistory.length === 1 ? "" : "s"} recorded`
              : "No payment history yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory
                .sort((a, b) => Number(b.paymentDate) - Number(a.paymentDate))
                .map((payment, index) => (
                  <div
                    key={`${payment.paymentId}-${index}`}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {getTierDisplayName(payment.plan)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {payment.paymentId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to premium features at the end of your current billing period:
              <br />
              <strong>{formatDate(subscriptionData?.subscriptionEndDate)}</strong>
              <br /><br />
              You can reactivate your subscription anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Premium</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
