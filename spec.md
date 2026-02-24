# Consistency Tracker with Streak Rewards

## Current State

The app has:
- Free tier with 3 habits maximum
- Premium Monthly ($4.99/month) and Premium Yearly ($49.99/year) subscriptions
- Stripe payment integration
- Premium features: unlimited habits, advanced analytics, data export, habit categories, goal tracking
- User can track habits and build streaks
- Subscription management in Settings

## Requested Changes (Diff)

### Add
- **Streak Rewards System**:
  - 150-day streak milestone → 1 month free premium
  - 1000-day streak milestone → 1 year free premium
  - Rewards are earned per habit (longest streak counts)
  - Rewards stack if user qualifies for both
  - Backend tracks reward eligibility and auto-applies free premium time
  - Celebration modal/notification when milestone is reached
  - Visual indication of progress toward next streak milestone
  - "Earned Rewards" section in Settings showing active and past rewards

### Modify
- Subscription status now includes "Reward" type alongside "Premium Monthly/Yearly"
- Analytics page shows progress toward streak rewards
- Habit cards display milestone progress indicators
- Backend subscription logic accounts for reward-based premium access

### Remove
- Nothing removed

## Implementation Plan

**Backend:**
1. Add streak reward tracking data structure (rewards earned, active reward periods, expiration dates)
2. Add endpoint to check and grant streak rewards when milestones hit
3. Add logic to calculate longest streak across all user habits
4. Modify subscription status check to include reward-based premium access
5. Add endpoint to fetch user's reward history and active rewards
6. Auto-extend premium access when rewards are earned

**Frontend:**
1. Add streak milestone progress UI on habit cards (e.g., "120/150 days to free month")
2. Create celebration modal for when rewards are earned
3. Add "Rewards" section in Settings showing:
   - Active rewards with expiration dates
   - Earned rewards history
   - Next milestone progress
4. Update Analytics to show overall progress toward rewards
5. Add visual badges/indicators for users with active rewards
6. Show reward-based premium status differently from paid premium

## UX Notes

- Celebrate the achievement: Big, exciting modal when they hit 150 or 1000 days
- Progress visibility: Users should always see how close they are to the next reward
- Clear communication: Explain that rewards stack and show expiration dates
- Motivation: Use progress indicators to encourage continued consistency
- Transparency: Show full reward history in Settings so users can track their achievements
