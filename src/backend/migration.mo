import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Text "mo:core/Text";

module {
  public type SubscriptionTier = {
    #free;
    #premium_monthly;
    #premium_yearly;
  };

  public type PaymentRecord = {
    paymentId : Text;
    userId : Principal.Principal;
    amount : Nat;
    currency : Text;
    paymentDate : Int;
    plan : SubscriptionTier;
    status : Text;
  };

  public type UserState = {
    subscription : SubscriptionTier;
    stripeCustomerId : ?Text;
    subscriptionStartDate : ?Int;
    subscriptionEndDate : ?Int;
    paymentRecords : List.List<PaymentRecord>;
  };

  public type UserProfile = {
    name : Text;
  };

  public type Habit = {
    id : Int;
    name : Text;
    description : ?Text;
    targetFrequency : Nat;
    reminderTime : ?Int;
    soundEnabled : Bool;
    category : ?Text;
    creator : Principal.Principal;
    createdAt : Int;
    lastUpdated : Int;
    streakCount : Nat;
  };

  type OldActor = {
    paymentRecords : Map.Map<Text, PaymentRecord>;
    userStates : Map.Map<Principal.Principal, UserState>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    habits : Map.Map<Int, Habit>;
    habitCompletions : Map.Map<Int, List.List<Int>>;
    habitGoals : Map.Map<Int, Text>;
  };

  public type StreakRewardType = {
    #oneMonthPremium;
    #oneYearPremium;
  };

  public type StreakReward = {
    rewardType : StreakRewardType;
    earnedDate : Int;
    expirationDate : Int;
    isActive : Bool;
    longestStreak : Nat;
  };

  type NewActor = {
    paymentRecords : Map.Map<Text, PaymentRecord>;
    userStates : Map.Map<Principal.Principal, UserState>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    habits : Map.Map<Int, Habit>;
    habitCompletions : Map.Map<Int, List.List<Int>>;
    habitGoals : Map.Map<Int, Text>;
    userRewards : Map.Map<Principal.Principal, List.List<StreakReward>>;
  };

  public func run(old : OldActor) : NewActor {
    { old with userRewards = Map.empty<Principal.Principal, List.List<StreakReward>>() };
  };
};
