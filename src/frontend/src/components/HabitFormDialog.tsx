import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Habit, HabitEntryInput } from "../backend.d";

interface HabitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: HabitEntryInput) => void;
  habit?: Habit;
  isSubmitting?: boolean;
}

export function HabitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  habit,
  isSubmitting = false,
}: HabitFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetFrequency, setTargetFrequency] = useState("7");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || "");
      setTargetFrequency(habit.targetFrequency.toString());
      setSoundEnabled(habit.soundEnabled);
      
      if (habit.reminderTime) {
        setReminderEnabled(true);
        const date = new Date(Number(habit.reminderTime) / 1_000_000);
        setReminderTime(
          `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );
      }
    } else {
      // Reset for new habit
      setName("");
      setDescription("");
      setTargetFrequency("7");
      setSoundEnabled(true);
      setReminderEnabled(false);
      setReminderTime("09:00");
    }
  }, [habit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let reminderTimeNanos: bigint | undefined;
    if (reminderEnabled && reminderTime) {
      const [hours, minutes] = reminderTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      reminderTimeNanos = BigInt(date.getTime()) * 1_000_000n;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      targetFrequency: BigInt(targetFrequency),
      soundEnabled,
      reminderTime: reminderTimeNanos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {habit ? "Edit Habit" : "New Habit"}
            </DialogTitle>
            <DialogDescription>
              {habit
                ? "Update your habit details below."
                : "Create a new habit to track your consistency."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                Habit Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning meditation"
                required
                className="text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this habit mean to you?"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Target Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-base font-medium">
                Target (days per week) *
              </Label>
              <Input
                id="frequency"
                type="number"
                min="1"
                max="7"
                value={targetFrequency}
                onChange={(e) => setTargetFrequency(e.target.value)}
                required
                className="text-base"
              />
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="sound" className="text-base font-medium cursor-pointer">
                  Sound Feedback
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when you complete this habit
                </p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {/* Reminder Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="reminder" className="text-base font-medium cursor-pointer">
                  Daily Reminder
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified at a specific time
                </p>
              </div>
              <Switch
                id="reminder"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {/* Reminder Time */}
            {reminderEnabled && (
              <div className="space-y-2 animate-bounce-in">
                <Label htmlFor="reminderTime" className="text-base font-medium">
                  Reminder Time
                </Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-base"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Saving..." : habit ? "Save Changes" : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
