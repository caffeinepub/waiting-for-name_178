// Audio feedback system using Web Audio API

const audioContext = typeof window !== "undefined" ? new AudioContext() : null;

// Play a satisfying completion sound
export function playCompletionSound() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Happy ascending notes
  oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
  oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
  oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.4
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.4);
}

// Play reminder notification sound
export function playReminderSound() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Gentle reminder bell
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
  oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.15); // C6

  oscillator.type = "triangle";
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Schedule reminder for a specific time
export function scheduleReminder(
  habitName: string,
  reminderTime: number,
  soundEnabled: boolean,
  onRemind: () => void
) {
  const now = new Date();
  const reminderDate = new Date(Number(reminderTime) / 1_000_000); // Convert nanoseconds to milliseconds

  // If reminder time is in the past today, schedule for tomorrow
  if (reminderDate < now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  if (timeUntilReminder > 0) {
    return setTimeout(() => {
      if (soundEnabled) {
        playReminderSound();
      }
      onRemind();
      
      // Show browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Time for: ${habitName}`, {
          body: "Keep your streak going!",
          icon: "/favicon.ico",
        });
      }
    }, timeUntilReminder);
  }

  return null;
}

// Request notification permission
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
