import Time "mo:core/Time";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  let habits = Map.empty<Int, Habit>();

  type HabitId = Int;
  type UserId = Principal;

  public type Habit = {
    id : HabitId;
    name : Text;
    description : ?Text;
    targetFrequency : Nat; // Times per week
    reminderTime : ?Int;
    soundEnabled : Bool;
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
  };

  let habitCompletions = Map.empty<HabitId, List.List<Int>>();

  public shared ({ caller }) func createHabit(habitData : HabitEntryInput) : async HabitId {
    let habitId = Time.now();
    let newHabit : Habit = {
      id = habitId;
      name = habitData.name;
      description = habitData.description;
      targetFrequency = habitData.targetFrequency;
      reminderTime = habitData.reminderTime;
      soundEnabled = habitData.soundEnabled;
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
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?existing) {
        if (existing.creator != caller) {
          Runtime.trap("Only the creator can update this habit");
        };
        let updatedHabit : Habit = {
          id = habitId;
          name = update.name;
          description = update.description;
          targetFrequency = update.targetFrequency;
          reminderTime = update.reminderTime;
          soundEnabled = update.soundEnabled;
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
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) {
        if (habit.creator != caller) {
          Runtime.trap("Only the creator can delete this habit");
        };
        habits.remove(habitId);
        habitCompletions.remove(habitId);
      };
    };
  };

  public query ({ caller }) func getHabit(habitId : HabitId) : async Habit {
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) { habit };
    };
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    habits.values().toArray().sort(
      func(a, b) {
        Int.compare(b.id, a.id);
      }
    );
  };

  public shared ({ caller }) func completeHabit(habitId : HabitId) : async () {
    switch (habits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?_) {
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
              existing.add(today);
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getRecentCompletions(habitId : HabitId, days : Nat) : async [Int] {
    switch (habitCompletions.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
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

  public query ({ caller }) func getHabitWithStats(habitId : HabitId) : async (Habit, [Int]) {
    switch (habits.get(habitId), habitCompletions.get(habitId)) {
      case (null, _) { Runtime.trap("Habit not found") };
      case (_, null) { Runtime.trap("Habit completions not found") };
      case (?habit, ?completions) {
        (habit, completions.toArray());
      };
    };
  };

  public query ({ caller }) func getAllHabitsWithStreaks() : async [(Habit, [Int])] {
    let iter = habits.entries();
    let resultList = List.empty<(Habit, [Int])>();

    func processEntry(entry : (HabitId, Habit)) {
      let (_, habit) = entry;
      switch (habitCompletions.get(habit.id)) {
        case (null) {};
        case (?completions) {
          resultList.add((habit, completions.toArray()));
        };
      };
    };

    iter.forEach(processEntry);
    resultList.toArray();
  };
};
