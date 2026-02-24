import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import Principal "mo:core/Principal";
import Migration "migration";
import Nat "mo:core/Nat";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Subscription Tier Types
  public type SubscriptionTier = {
    #free;
    #premium_monthly;
    #premium_yearly;
  };

  // Payment Record
  public type PaymentRecord = {
    paymentId : Text;
    userId : Principal;
    amount : Nat;
    currency : Text;
    paymentDate : Int;
    plan : SubscriptionTier;
    status : Text;
  };

  let paymentRecords = Map.empty<Text, PaymentRecord>();

  // Internal user state for subscription tracking
  public type UserStateView = {
    subscription : SubscriptionTier;
    stripeCustomerId : ?Text;
    subscriptionStartDate : ?Int;
    subscriptionEndDate : ?Int;
    paymentRecords : [PaymentRecord];
  };

  type UserState = {
    subscription : SubscriptionTier;
    stripeCustomerId : ?Text;
    subscriptionStartDate : ?Int;
    subscriptionEndDate : ?Int;
    paymentRecords : List.List<PaymentRecord>;
  };

  let userStates = Map.empty<Principal, UserState>();

  // User Profile (required by frontend)
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Habit types
  let habits = Map.empty<Int, Habit>();

  type HabitId = Int;
  type UserId = Principal;

  public type Habit = {
    id : HabitId;
    name : Text;
    description : ?Text;
    targetFrequency : Nat;
    reminderTime : ?Int;
    soundEnabled : Bool;
    category : ?Text;
    creator : UserId;
    createdAt : Int;
    lastUpdated : Int;
    streakCount : Nat;
  };

  public type HabitEntryInput = {
    name : Text;
    description : ?Text;
    targetFrequency : Nat;
    reminderTime : ?Int;
    soundEnabled : Bool;
    category : ?Text;
  };

  let habitCompletions = Map.empty<HabitId, List.List<Int>>();
  let habitGoals = Map.empty<HabitId, Text>();

  // Stripe configuration
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Streak Reward Types
  public type StreakRewardType = {
    #oneMonthPremium;
    #oneYearPremium;
  };

  // Streak Reward Record
  public type StreakReward = {
    rewardType : StreakRewardType;
    earnedDate : Int;
    expirationDate : Int;
    isActive : Bool;
    longestStreak : Nat;
  };

  // Map to store rewards per user
  let userRewards = Map.empty<Principal, List.List<StreakReward>>();

  // Reward Milestones
  public type RewardMilestone = {
    milestoneDays : Nat;
    rewardType : StreakRewardType;
  };

  let rewardMilestones = List.fromArray<RewardMilestone>(
    [
      {
        milestoneDays = 150;
        rewardType = #oneMonthPremium;
      },
      {
        milestoneDays = 1000;
        rewardType = #oneYearPremium;
      },
    ]
  );

  public type StreakRewardStatus = {
    currentStreak : Nat;
    longestStreak : Nat;
    nextMilestone : ?RewardMilestone;
    activeRewards : [StreakReward];
    rewardHistory : [StreakReward];
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func countDaysStreak(completions : List.List<Int>) : Nat {
    var streak = 0;
    var currentDay = Time.now() / 86_400_000_000_000;
    let reversedCompletions = completions.toArray().reverse();
    for (day in reversedCompletions.values()) {
      if (day > currentDay) {
      } else if (day == currentDay) {
        // Completed today, increment streak and move to next day
        streak += 1;
        currentDay -= 1;
      } else if (day == currentDay - 1) {
        // Gap of one day is acceptable
        streak += 1;
        currentDay -= 2;
      } else if (day == currentDay - 2) {
        // Only count if it's the very first entry and no other completions exist after this day
        if (streak == 0) {
          streak += 1;
        } else {
          // Gap of more than one day (excluding first entry) ends the streak
          return streak;
        };
      } else {
        // Gap of more than one day ends the streak
        return streak;
      };
    };
    streak;
  };

  func calculateLongestStreak(habits : Map.Map<Int, Habit>, completions : Map.Map<HabitId, List.List<Int>>, userId : Principal) : Nat {
    var longestStreak = 0;
    for ((_, habit) in habits.entries()) {
      if (habit.creator == userId) {
        switch (completions.get(habit.id)) {
          case (null) {};
          case (?habitCompletions) {
            let habitStreak = countDaysStreak(habitCompletions);
            if (habitStreak > longestStreak) {
              longestStreak := habitStreak;
            };
          };
        };
      };
    };
    longestStreak;
  };

  func checkAndGrantRewards(longestStreak : Nat, rewards : List.List<StreakReward>, currentTime : Int) : (List.List<StreakReward>, Nat) {
    let newRewards = List.empty<StreakReward>();
    var extensionDuration = 0;

    for (milestone in rewardMilestones.values()) {
      if (longestStreak >= milestone.milestoneDays) {
        // Check if reward was already granted for this milestone
        let alreadyGranted = rewards.any(
          func(reward) {
            reward.rewardType == milestone.rewardType;
          }
        );

        if (not alreadyGranted) {
          let rewardDuration = switch (milestone.rewardType) {
            case (#oneMonthPremium) { 30_000_000_000_000 }; // 30 days in ns
            case (#oneYearPremium) { 31536000000000000 }; // 1 year in ns
          };

          let newReward : StreakReward = {
            rewardType = milestone.rewardType;
            earnedDate = currentTime;
            expirationDate = currentTime + rewardDuration;
            isActive = true;
            longestStreak;
          };

          newRewards.add(newReward);
          extensionDuration += rewardDuration;
        };
      };
    };

    let rewardsArray = rewards.toArray();
    let combinedArray = rewardsArray.concat(newRewards.toArray());
    let combinedList = List.fromArray<StreakReward>(combinedArray);

    (combinedList, extensionDuration);
  };

  // Helper function to get active reward extensions
  func getActiveRewardExtensions(rewards : List.List<StreakReward>, currentTime : Int) : Int {
    var extensionTime = 0;
    for (reward in rewards.values()) {
      if (reward.isActive and reward.expirationDate > currentTime) {
        switch (reward.rewardType) {
          case (#oneMonthPremium) { extensionTime += 30_000_000_000_000 }; // 30 days in ns
          case (#oneYearPremium) { extensionTime += 31536000000000000 }; // 1 year in ns
        };
      };
    };
    extensionTime;
  };

  // Function to update subscription end date with extension logic
  func updateSubscriptionEndDate(existingEndDate : ?Int, currentTime : Int, extensionDuration : Int) : Int {
    switch (existingEndDate) {
      case (null) {
        currentTime + extensionDuration;
      };
      case (?endDate) {
        if (endDate > currentTime) {
          endDate + extensionDuration;
        } else {
          currentTime + extensionDuration;
        };
      };
    };
  };

  // Helper function to check premium status synchronously
  func isPremiumUserSync(userId : Principal) : Bool {
    let currentTime = Time.now();

    switch (userStates.get(userId)) {
      case (null) { false };
      case (?state) {
        switch (state.subscription) {
          case (#free) { false };
          case (#premium_monthly) {
            // Check if subscription or reward extension is still valid
            switch (state.subscriptionEndDate) {
              case (null) { true };
              case (?endDate) {
                if (currentTime <= endDate) {
                  true;
                } else {
                  // Check if active reward extensions exist
                  let activeRewards = switch (userRewards.get(userId)) {
                    case (null) { List.empty<StreakReward>() };
                    case (?rewardsList) { rewardsList };
                  };
                  let activeExtensions = getActiveRewardExtensions(activeRewards, currentTime);
                  activeExtensions > 0;
                };
              };
            };
          };
          case (#premium_yearly) {
            // Yearly premium is always valid
            true;
          };
        };
      };
    };
  };

  public query ({ caller }) func getStreakRewardStatus(userId : Principal) : async StreakRewardStatus {
    // Allow users to query their own status or admins to query any user
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users can view their own status or admins can view any");
    };

    // Calculate longest streak across all habits
    let longestStreak = calculateLongestStreak(habits, habitCompletions, userId);

    // Determine current streak (for active habit, should be current habit's streak)
    let currentStreak = if (longestStreak > 0) { longestStreak } else { 0 };

    // Find next unachieved milestone
    let nextMilestone = rewardMilestones.find(
      func(milestone) {
        longestStreak < milestone.milestoneDays;
      }
    );

    // Get reward history for user
    let rewards = switch (userRewards.get(userId)) {
      case (null) { List.empty<StreakReward>() };
      case (?rewardsList) { rewardsList };
    };

    // Filter active rewards
    let activeRewards = rewards.filter(
      func(reward) {
        reward.isActive and reward.expirationDate > Time.now();
      }
    );

    // Return current reward status
    {
      currentStreak;
      longestStreak;
      nextMilestone;
      activeRewards = activeRewards.toArray();
      rewardHistory = rewards.toArray();
    };
  };

  // Helper function to get active rewards for a user
  public query ({ caller }) func getActiveRewards(userId : Principal) : async [StreakReward] {
    // Allow users to query their own rewards or admins to query any user
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users can view their own rewards");
    };

    let currentTime = Time.now();

    let rewards = switch (userRewards.get(userId)) {
      case (null) { List.empty<StreakReward>() };
      case (?rewardsList) { rewardsList };
    };

    let activeRewards = rewards.filter(
      func(reward) {
        reward.isActive and reward.expirationDate > currentTime;
      }
    );

    activeRewards.toArray();
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  // Stripe setup - Admin only
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  // User can create checkout session for themselves
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Subscription Tracking Functions
  public query ({ caller }) func getSubscriptionTier(userId : Principal) : async SubscriptionTier {
    // Users can only view their own subscription, admins can view any
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscription");
    };
    switch (userStates.get(userId)) {
      case (null) { #free };
      case (?userState) { userState.subscription };
    };
  };

  // Admin-only or webhook-only function to update subscriptions
  public shared ({ caller }) func updateSubscription(userId : Principal, tier : SubscriptionTier, stripeId : ?Text, startDate : ?Int, endDate : ?Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscriptions");
    };
    let existing = switch (userStates.get(userId)) {
      case (null) {
        {
          subscription = tier;
          stripeCustomerId = stripeId;
          subscriptionStartDate = startDate;
          subscriptionEndDate = endDate;
          paymentRecords = List.empty<PaymentRecord>();
        };
      };
      case (?state) {
        {
          subscription = tier;
          stripeCustomerId = stripeId;
          subscriptionStartDate = startDate;
          subscriptionEndDate = endDate;
          paymentRecords = state.paymentRecords;
        };
      };
    };
    userStates.add(userId, existing);
  };

  // Admin-only function to add payment records
  public shared ({ caller }) func addPaymentRecord(record : PaymentRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add payment records");
    };
    paymentRecords.add(record.paymentId, record);
    switch (userStates.get(record.userId)) {
      case (null) {
        let state : UserState = {
          subscription = record.plan;
          stripeCustomerId = null;
          subscriptionStartDate = ?record.paymentDate;
          subscriptionEndDate = ?(record.paymentDate + 31_536_000_000_000); // 1 year in nanoseconds
          paymentRecords = List.fromArray<PaymentRecord>([record]);
        };
        userStates.add(record.userId, state);
      };
      case (?existing) {
        let updatedRecords = List.fromArray<PaymentRecord>(
          existing.paymentRecords.toArray().concat([record])
        );
        let updatedState = {
          existing with
          paymentRecords = updatedRecords;
        };
        userStates.add(record.userId, updatedState);
      };
    };
  };

  // Query to check if a user has premium - users can check their own, admins can check any
  public query ({ caller }) func isPremiumUser(userId : Principal) : async Bool {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own premium status");
    };
    isPremiumUserSync(userId);
  };

  // User can view their own subscription details
  public query ({ caller }) func getMySubscriptionDetails() : async ?UserStateView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscription details");
    };
    switch (userStates.get(caller)) {
      case (null) { null };
      case (?state) { ?toUserStateView(state) };
    };
  };

  // Helper function to convert mutable UserState to immutable UserStateView
  func toUserStateView(state : UserState) : UserStateView {
    {
      subscription = state.subscription;
      stripeCustomerId = state.stripeCustomerId;
      subscriptionStartDate = state.subscriptionStartDate;
      subscriptionEndDate = state.subscriptionEndDate;
      paymentRecords = state.paymentRecords.toArray();
    };
  };

  // User can view their own payment history
  public query ({ caller }) func getMyPaymentHistory() : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };
    switch (userStates.get(caller)) {
      case (null) { [] };
      case (?state) { state.paymentRecords.toArray() };
    };
  };

  // Habit Management
  public shared ({ caller }) func createHabit(habitData : HabitEntryInput) : async HabitId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create habits");
    };

    let userTier = switch (userStates.get(caller)) {
      case (null) { #free };
      case (?state) { state.subscription };
    };

    let userHabitCount = habits.values().toArray().filter(
      func(h) { h.creator == caller },
    ).size();

    if (userTier == #free and userHabitCount >= 3) {
      Runtime.trap("Free users can only create up to 3 habits");
    };

    let habitId = Time.now();
    let newHabit : Habit = {
      id = habitId;
      name = habitData.name;
      description = habitData.description;
      targetFrequency = habitData.targetFrequency;
      reminderTime = habitData.reminderTime;
      soundEnabled = habitData.soundEnabled;
      category = habitData.category;
      creator = caller;
      createdAt = Time.now();
      lastUpdated = Time.now();
      streakCount = 0;
    };
    habits.add(habitId, newHabit);
    habitCompletions.add(habitId, List.empty<Int>());
    habitId;
  };

  public shared ({ caller }) func updateHabit(habitId : HabitId, update : HabitEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?existing) {
        if (existing.creator != caller) {
          Runtime.trap("Unauthorized: Only the creator can update this habit");
        };
        let updatedHabit : Habit = {
          id = habitId;
          name = update.name;
          description = update.description;
          targetFrequency = update.targetFrequency;
          reminderTime = update.reminderTime;
          soundEnabled = update.soundEnabled;
          category = update.category;
          creator = existing.creator;
          createdAt = existing.createdAt;
          lastUpdated = Time.now();
          streakCount = existing.streakCount;
        };
        habits.add(habitId, updatedHabit);
      };
    };
  };

  public shared ({ caller }) func deleteHabit(habitId : HabitId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller) {
          Runtime.trap("Unauthorized: Only the creator can delete this habit");
        };
        habits.remove(habitId);
        habitCompletions.remove(habitId);
        habitGoals.remove(habitId);
      };
    };
  };

  public query ({ caller }) func getHabit(habitId : HabitId) : async Habit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        // Users can only view their own habits
        if (habit.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own habits");
        };
        habit;
      };
    };
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };
    // Return only the caller's habits
    habits.values().toArray().filter(
      func(h) { h.creator == caller }
    ).sort(
      func(a, b) {
        Int.compare(b.id, a.id);
      }
    );
  };

  public shared ({ caller }) func completeHabit(habitId : HabitId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete habits");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        // Users can only complete their own habits
        if (habit.creator != caller) {
          Runtime.trap("Unauthorized: Can only complete your own habits");
        };
        let today = Time.now() / 86_400_000_000_000;
        switch (habitCompletions.get(habitId)) {
          case (null) {
            habitCompletions.add(habitId, List.fromArray([today]));
          };
          case (?existing) {
            let alreadyCompleted = existing.any(
              func(day) { day == today }
            );
            if (alreadyCompleted) {
              Runtime.trap("Habit already completed today");
            } else {
              let updatedCompletions = List.fromArray(
                existing.toArray().concat([today])
              );
              habitCompletions.add(habitId, updatedCompletions);

              // Calculate longest streak and reward logic
              let longestStreak = calculateLongestStreak(habits, habitCompletions, caller);

              let existingRewards = switch (userRewards.get(caller)) {
                case (null) { List.empty<StreakReward>() };
                case (?rewardsList) { rewardsList };
              };

              let (updatedRewards, rewardExtension) = checkAndGrantRewards(
                longestStreak,
                existingRewards,
                Time.now(),
              );

              if (rewardExtension > 0) {
                let currentEndDate = switch (userStates.get(caller)) {
                  case (null) { null };
                  case (?state) { state.subscriptionEndDate };
                };
                let updatedEndDate = updateSubscriptionEndDate(
                  currentEndDate,
                  Time.now(),
                  rewardExtension,
                );

                let currentState = switch (userStates.get(caller)) {
                  case (null) {
                    {
                      subscription = #free;
                      stripeCustomerId = null;
                      subscriptionStartDate = ?Time.now();
                      subscriptionEndDate = ?updatedEndDate;
                      paymentRecords = List.empty<PaymentRecord>();
                    };
                  };
                  case (?state) { state };
                };

                let updatedState = {
                  currentState with
                  subscriptionEndDate = ?updatedEndDate;
                };
                userStates.add(caller, updatedState);
              };

              userRewards.add(caller, updatedRewards);
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getRecentCompletions(habitId : HabitId, days : Nat) : async [Int] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view completions");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own habit completions");
        };
        switch (habitCompletions.get(habitId)) {
          case (null) { [] };
          case (?completions) {
            let today = Time.now() / 86_400_000_000_000;
            let recent = completions.toArray().filter(
              func(entry) {
                entry >= today - days and entry <= today;
              }
            );
            recent;
          };
        };
      };
    };
  };

  public query ({ caller }) func getHabitWithStats(habitId : HabitId) : async (Habit, [Int]) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habit stats");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own habit stats");
        };
        switch (habitCompletions.get(habitId)) {
          case (null) { (habit, []) };
          case (?completions) {
            (habit, completions.toArray());
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllHabitsWithStreaks() : async [(Habit, [Int])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };
    // Return only the caller's habits with their completions
    let userHabits = habits.values().toArray().filter(
      func(h) { h.creator == caller }
    );

    userHabits.map(
      func(habit) {
        let completions = switch (habitCompletions.get(habit.id)) {
          case (null) { [] };
          case (?c) { c.toArray() };
        };
        (habit, completions);
      }
    );
  };

  // Premium features
  public shared ({ caller }) func addHabitGoal(habitId : HabitId, goal : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set habit goals");
    };
    if (not isPremiumUserSync(caller)) {
      Runtime.trap("Only premium users can set habit goals");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller) {
          Runtime.trap("Unauthorized: Can only set goals for your own habits");
        };
        habitGoals.add(habitId, goal);
      };
    };
  };

  public query ({ caller }) func getHabitGoal(habitId : HabitId) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habit goals");
    };
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own habit goals");
        };
        habitGoals.get(habitId);
      };
    };
  };

  // Premium-only data export
  public shared ({ caller }) func exportAllHabitData() : async [(Habit, [Int])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export data");
    };
    if (not isPremiumUserSync(caller)) {
      Runtime.trap("Only premium users can export habit data");
    };
    let creatorHabits = habits.values().toArray().filter(
      func(h) { h.creator == caller },
    );
    let result = creatorHabits.map(
      func(h) {
        let completions = switch (habitCompletions.get(h.id)) {
          case (null) { [] };
          case (?c) { c.toArray() };
        };
        (h, completions);
      }
    );
    result;
  };
};
